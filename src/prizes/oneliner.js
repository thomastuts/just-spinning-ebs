import getChatInput from "../lib/get-chat-input.js";
import db from "../lib/db.js";
import sendPubsubMessage from "../lib/send-pubsub-message.js";
import getRandomElementFromArray from "../lib/get-random-element-from-array.js";
import { getClient } from "../lib/tmi.js";
import PRIZE_STATUSES from "../constants/prize-statuses.js";

const persistInput = async ({ prizeId, role, input }) => {
  await db("prizes")
    .where({ id: prizeId })
    .update({
      [`${role}_input`]: input,
    });
};

export async function start(prizeId) {
  console.log("Starting oneliner", prizeId);
  const channelName = "quin69"; // TODO

  const metadata = {
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
        ...metadata,
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
    client.disconnect();
    await sendPubsubMessage(channelId, "activePrizeUpdate");
  }, 10000);
}
