import getChatInput from "../lib/get-chat-input.js";
import db from "../lib/db.js";
import sendPubsubMessage from "../lib/send-pubsub-message.js";
import getRandomElementFromArray from "../lib/get-random-element-from-array.js";
import { getClient } from "../lib/tmi.js";
import PRIZE_STATUSES from "../constants/prize-statuses.js";

const PROMPTS = [
  "Introducing X-treme Baseball! It’s like baseball, but with __________!",
  "Dude, do not go in that bathroom. There’s __________ in there.",
  "Hey Reddit! I’m __________. Ask me anything.",
  "Next from J.K. Rowling: Harry Potter and the Chamber of __________.",
  "Kids, I don’t need drugs to get high. I’m high on __________.",
  "Just once, I’d like to hear you say “Thanks, Mom. Thanks for __________.”",
  "Instead of coal, Santa now gives the bad children __________.",
  "A romantic, candlelit dinner would be incomplete without __________.",
  "Just saw this upsetting video! Please retweet!! #stop__________",
  "The class field trip was completely ruined by __________.",
];

const persistInput = async ({ prizeId, role, input }) => {
  await db("prizes")
    .where({ id: prizeId })
    .update({
      [`${role}_input`]: input,
    });
};

export async function start(prizeId, channelName) {
  console.log("Starting fill in the blank", prizeId);
  const randomPrompt = getRandomElementFromArray(PROMPTS);

  const metadata = {
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
      metadata: metadata,
      status: PRIZE_STATUSES.IN_PROGRESS,
    });

  const prize = await db("prizes")
    .where({
      id: prizeId,
    })
    .first();

  const channelId = prize.channel_id;

  await sendPubsubMessage(channelId, "activePrizeUpdate");

  await Promise.all([
    (async () => {
      const input = await getChatInput({
        channelId,
        channelName,
        viewerId: channelId,
      });
      await persistInput({ prizeId, input, role: "streamer" });
      await sendPubsubMessage(channelId, "activePrizeUpdate");

      return input;
    })(),
    (async () => {
      const input = await getChatInput({
        channelId,
        channelName,
        viewerId: prize.viewer_id,
      });
      await persistInput({ prizeId, input, role: "viewer" });
      await sendPubsubMessage(channelId, "activePrizeUpdate");

      return input;
    })(),
  ]);

  metadata.isVoteInProgress = true;

  await db("prizes")
    .where({
      id: prizeId,
    })
    .update({
      metadata: metadata,
    });

  await sendPubsubMessage(channelId, "activePrizeUpdate");

  const client = getClient({ channels: [channelName] });

  client.connect();

  client.on("message", async (channel, tags, message, self) => {
    const messageViewerId = tags["user-id"];
    const isMessageFromViewer = messageViewerId === prize.viewer_id;
    const isMessageFromStreamer = messageViewerId === channelId;
    const isCommand = message.trim().startsWith("!s");

    if (!(isMessageFromViewer || isMessageFromStreamer) && isCommand) {
      const hasViewerVoted =
        metadata.votes.streamer.includes(messageViewerId) ||
        metadata.votes.viewer.includes(messageViewerId);

      if (hasViewerVoted) {
        return;
      }

      const messageContent = message.replace("!s", "").trim();
      let shouldPersist = false;

      if (messageContent === "1") {
        console.log("Vote for streamer");
        metadata.votes.streamer = [...metadata.votes.streamer, messageViewerId];
        shouldPersist = true;
      } else if (messageContent === "2") {
        console.log("Vote for viewer");
        metadata.votes.viewer = [...metadata.votes.viewer, messageViewerId];
        shouldPersist = true;
      }

      if (shouldPersist) {
        await db("prizes")
          .where({
            id: prizeId,
          })
          .update({
            metadata: metadata,
          });

        await sendPubsubMessage(channelId, "activePrizeUpdate");
      }
    }
  });

  setTimeout(async () => {
    console.log("Voting ended");
    metadata.isVoteInProgress = false;
    await db("prizes")
      .where({
        id: prizeId,
      })
      .update({
        metadata: metadata,
      });
    await sendPubsubMessage(channelId, "activePrizeUpdate");
    client.disconnect();
    await sendPubsubMessage(channelId, "activePrizeUpdate");
  }, 30000);
}
