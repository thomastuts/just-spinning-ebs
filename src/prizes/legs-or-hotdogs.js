import getChatInput from "../lib/get-chat-input.js";
import db from "../lib/db.js";
import sendPusherMessage from "../lib/send-pusher-message.js";

const getRandomOption = () => (Math.random() > 0.5 ? "legs" : "hotdogs");

const messageContentValidator = (message) => {
  const parsedMessage = message.toLowerCase().replace(/\s/, "");
  return ["legs", "hotdogs"].includes(parsedMessage);
};

const persistInput = async ({ prizeId, role, input }) => {
  await db("prizes")
    .where({ id: prizeId })
    .update({
      [`${role}_input`]: input,
    });
};

export async function start(prizeId) {
  console.log("Starting legs or hotdogs quiz.");
  const channelName = "streamingtoolsmith"; // TODO

  const prize = await db("prizes")
    .where({
      id: prizeId,
    })
    .first();

  const winningOption = getRandomOption();
  console.log("winningOption:", winningOption);

  const channelId = prize.channel_id;

  const [streamerInput, viewerInput] = await Promise.all([
    (async () => {
      const input = await getChatInput({
        channelId,
        channelName,
        viewerId: channelId,
        validate: messageContentValidator,
      });
      await persistInput({ prizeId, input, role: "streamer" });
      await sendPusherMessage(channelId, "activePrizeUpdate");

      return input;
    })(),
    (async () => {
      const input = await getChatInput({
        channelId,
        channelName,
        viewerId: prize.viewer_id,
        validate: messageContentValidator,
      });
      await persistInput({ prizeId, input, role: "viewer" });
      await sendPusherMessage(channelId, "activePrizeUpdate");

      return input;
    })(),
  ]);

  console.log("Inputs:");
  console.log({ streamerInput, viewerInput });

  // await sendPusherMessage(channelId, "prizeEndAnimation");
}
