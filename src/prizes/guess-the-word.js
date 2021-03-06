import _ from "lodash";

import getChatInput from "../lib/get-chat-input.js";
import db from "../lib/db.js";
import sendPubsubMessage from "../lib/send-pubsub-message.js";
import getRandomElementFromArray from "../lib/get-random-element-from-array.js";
import { getClient } from "../lib/tmi.js";
import PRIZE_STATUSES from "../constants/prize-statuses.js";

const WORDS = [
  "broomstick",
  "commercial",
  "flashlight",
  "lighthouse",
  "lightsaber",
  "microphone",
  "photograph",
  "skyscraper",
  "strawberry",
  "sunglasses",
  "toothbrush",
  "toothpaste",
  "blueberry",
  "breakfast",
  "bubblegum",
  "cellphone",
  "hairbrush",
  "hamburger",
  "jellyfish",
  "landscape",
  "nightmare",
  "rectangle",
  "snowboard",
  "spaceship",
  "telephone",
  "telescope",
  "backpack",
  "basement",
  "building",
  "campfire",
  "elephant",
  "exercise",
  "hospital",
  "internet",
  "mosquito",
  "sandwich",
  "scissors",
  "skeleton",
  "snowball",
  "treasure",
  "balloon",
  "biscuit",
  "blanket",
  "chicken",
  "chimney",
  "country",
  "cupcake",
  "curtain",
  "diamond",
  "eyebrow",
  "fireman",
  "harpoon",
  "husband",
  "morning",
  "octopus",
  "popcorn",
  "printer",
  "sandbox",
  "skyline",
  "spinach",
];

const persistInput = async ({ prizeId, role, input }) => {
  await db("prizes")
    .where({ id: prizeId })
    .update({
      [`${role}_input`]: input,
    });
};

const getLetterRevealOrder = (word) => {
  const uniqueLetters = _.uniq(word.split(""));
  return _.shuffle(uniqueLetters);
};

export async function start(prizeId, channelName) {
  console.log("Starting guess the word", prizeId);
  const randomWord = getRandomElementFromArray(WORDS);

  const initialMetadata = {
    word: randomWord,
    letterRevealOrder: getLetterRevealOrder(randomWord),
    revealInterval: 8,
  };

  await db("prizes")
    .where({
      id: prizeId,
    })
    .update({
      metadata: initialMetadata,
      status: PRIZE_STATUSES.IN_PROGRESS,
    });

  const prize = await db("prizes")
    .where({
      id: prizeId,
    })
    .first();

  const channelId = prize.channel_id;

  await sendPubsubMessage(channelId, "activePrizeUpdate");

  const client = getClient({ channels: [channelName] });

  client.connect();

  client.on("message", async (channel, tags, message, self) => {
    const messageViewerId = tags["user-id"];
    const isMessageFromViewer = messageViewerId === prize.viewer_id;
    const isMessageFromStreamer = messageViewerId === channelId;
    const isCommand = message.trim().startsWith("!s");

    console.log({ isMessageFromStreamer, isMessageFromViewer, isCommand });

    // TODO: expand to include streamer input
    if (isCommand) {
      const messageContent = message.replace("!s", "").trim();
      if (isMessageFromViewer) {
        prize.viewer_input = messageContent;
      } else if (isMessageFromStreamer) {
        prize.streamer_input = messageContent;
      }

      console.log("Updating in DB");
      console.log({
        id: prizeId,
      });
      console.log({
        viewer_input: prize.viewer_input,
        streamer_input: prize.streamer_input,
      });
      await db("prizes")
        .where({
          id: prizeId,
        })
        .update({
          viewer_input: prize.viewer_input,
          streamer_input: prize.streamer_input,
        });

      await sendPubsubMessage(channelId, "activePrizeUpdate");
    }

    // TODO: less strict matching, use lowercase etc
    if (
      prize.viewer_input === randomWord ||
      prize.streamer_input === randomWord
    ) {
      await db("prizes")
        .where({
          id: prizeId,
        })
        .update({
          status: PRIZE_STATUSES.COMPLETED,
        });

      await sendPubsubMessage(channelId, "activePrizeUpdate");

      client.disconnect();
    }
  });
}
