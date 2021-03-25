import _ from "lodash";

import getChatInput from "../lib/get-chat-input.js";
import db from "../lib/db.js";
import sendPusherMessage from "../lib/send-pusher-message.js";
import getRandomElementFromArray from "../lib/get-random-element-from-array.js";
import { getClient } from "../lib/tmi.js";
import PRIZE_STATUSES from "../constants/prize-statuses.js";

const PROMPTS = [
  "Introducing X-treme Baseball! It’s like baseball, but with __________!",
  "Dude, do not go in that bathroom. There’s __________ in there.",
  "Hey Reddit! I’m __________________. Ask me anything.",
  "Next from J.K. Rowling: Harry Potter and the Chamber of __________________.",
  "Kids, I don’t need drugs to get high. I’m high on __________.",
  "Just once, I’d like to hear you say “Thanks, Mom. Thanks for _________________.”",
  "Instead of coal, Santa now gives the bad children __________________.",
  "A romantic, candlelit dinner would be incomplete without __________________.",
  "Just saw this upsetting video! Please retweet!! #stop_____________",
  "The class field trip was completely ruined by __________________.",
];

const persistInput = async ({ prizeId, role, input }) => {
  await db("prizes")
    .where({ id: prizeId })
    .update({
      [`${role}_input`]: input,
    });
};

export async function start(prizeId) {
  console.log("Starting fill in the blank", prizeId);
  const channelName = "PUbg"; // TODO
  const randomPrompt = getRandomElementFromArray(PROMPTS);

  const initialMetadata = {
    prompt: randomPrompt,
    isVoteInProgress: false,
    votes: {
      streamer: [],
      viewer: [],
    },
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

  await sendPusherMessage(channelId, "activePrizeUpdate");

  // await Promise.all([
  //   (async () => {
  //     const input = await getChatInput({
  //       channelId,
  //       channelName,
  //       viewerId: channelId,
  //     });
  //     await persistInput({ prizeId, input, role: "streamer" });
  //     await sendPusherMessage(channelId, "activePrizeUpdate");
  //
  //     return input;
  //   })(),
  //   (async () => {
  //     const input = await getChatInput({
  //       channelId,
  //       channelName,
  //       viewerId: prize.viewer_id,
  //     });
  //     await persistInput({ prizeId, input, role: "viewer" });
  //     await sendPusherMessage(channelId, "activePrizeUpdate");
  //
  //     return input;
  //   })(),
  // ]);

  await db("prizes")
    .where({
      id: prizeId,
    })
    .update({
      metadata: {
        ...initialMetadata,
        isVoteInProgress: true,
      },
    });

  const client = getClient({ channels: [channelName] });

  client.connect();

  client.on("message", async (channel, tags, message, self) => {
    message = getRandomElementFromArray(["!s 1", "!s 2"]); // TODO: remove this
    const messageViewerId = tags["user-id"];
    const isMessageFromViewer = messageViewerId === prize.viewer_id;
    const isMessageFromStreamer = messageViewerId === channelId;
    const isCommand = message.trim().startsWith("!s");

    if (!(isMessageFromViewer || isMessageFromStreamer) && isCommand) {
      const hasViewerVoted =
        initialMetadata.votes.streamer.includes(messageViewerId) ||
        initialMetadata.votes.viewer.includes(messageViewerId);

      if (hasViewerVoted) {
        return;
      }

      const messageContent = message.replace("!s", "").trim();
      let shouldPersist = false;

      if (messageContent === "1") {
        console.log("Vote for streamer");
        initialMetadata.votes.streamer = [
          ...initialMetadata.votes.streamer,
          messageViewerId,
        ];
        shouldPersist = true;
      } else if (messageContent === "2") {
        console.log("Vote for viewer");
        initialMetadata.votes.viewer = [
          ...initialMetadata.votes.viewer,
          messageViewerId,
        ];
        shouldPersist = true;
      }

      if (shouldPersist) {
        await db("prizes")
          .where({
            id: prizeId,
          })
          .update({
            metadata: initialMetadata,
          });

        await sendPusherMessage(channelId, "activePrizeUpdate");
      }
    }
  });

  setTimeout(async () => {
    console.log("Voting ended");
    client.disconnect();
    await sendPusherMessage(channelId, "activePrizeUpdate");
  }, 10000);
}
