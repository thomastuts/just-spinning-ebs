import getChatInput from "../lib/get-chat-input.js";
import db from "../lib/db.js";
import sendPusherMessage from "../lib/send-pusher-message.js";
import getRandomElementFromArray from "../lib/get-random-element-from-array.js";

const IMAGE_URLS_BY_TYPE = {
  legs: [
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/legs1.jpeg",
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/legs2.jpeg",
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/legs3.jpeg",
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/legs4.jpeg",
  ],
  hotdogs: [
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/hotdogs1.png",
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/hotdogs2.png",
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/hotdogs3.jpeg",
    "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/hotdogs4.jpeg",
  ],
};

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
  const channelName = "streamingtoolsmith"; // TODO

  const winningOption = getRandomElementFromArray(["legs", "hotdogs"]);
  const randomImageForWinningOption = getRandomElementFromArray(
    IMAGE_URLS_BY_TYPE[winningOption]
  );

  await db("prizes")
    .where({
      id: prizeId,
    })
    .update({
      metadata: {
        winningOption,
        image: randomImageForWinningOption,
      },
    });

  const prize = await db("prizes")
    .where({
      id: prizeId,
    })
    .first();

  const channelId = prize.channel_id;

  await sendPusherMessage(channelId, "activePrizeUpdate");

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
