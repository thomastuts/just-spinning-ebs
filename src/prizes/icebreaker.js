import getChatInput from "../lib/get-chat-input.js";
import db from "../lib/db.js";
import sendPubsubMessage from "../lib/send-pubsub-message.js";
import getRandomElementFromArray from "../lib/get-random-element-from-array.js";

const ICEBREAKER_PROMPTS = [
  "The zombie apocalypse is coming, who are 3 people you want on your team?",
  "If you were a wrestler what would be your entrance theme song?",
  "You have your own late night talk show, who do you invite as your first guest?",
  "If you had to eat one meal everyday for the rest of your life what would it be?",
  "What fictional family would you be a member of?",
  "What’s the weirdest food you’ve ever eaten?",
  "You can have an unlimited supply of one thing for the rest of your life, what is it? Sushi? Scotch Tape?",
  "If you could be any supernatural creature, what would you be and why?",
  "If you could go to Mars, would you? Why or why not?",
  "If you could have the power of teleportation right now, where would you go and why?",
  "Would you rather meet your travel back in time to meet your ancestors or to the future to meet your descendants?",
  "Would you rather always be slightly late or super early?",
  "Would you rather be able to run at 100 miles per hour or fly at 10 miles per hour?",
  "Do you have any crazy roommate stories?",
  "What’s the funniest thing that ever happened on your family vacation?",
];

const persistInput = async ({ prizeId, role, input }) => {
  await db("prizes")
    .where({ id: prizeId })
    .update({
      [`${role}_input`]: input,
    });
};

export async function start(prizeId) {
  console.log("Starting icebreaker.");
  const channelName = "streamingtoolsmith"; // TODO

  const randomPrompt = getRandomElementFromArray(ICEBREAKER_PROMPTS);

  await db("prizes")
    .where({
      id: prizeId,
    })
    .update({
      metadata: {
        prompt: randomPrompt,
      },
    });

  const prize = await db("prizes")
    .where({
      id: prizeId,
    })
    .first();

  const channelId = prize.channel_id;

  const input = await getChatInput({
    channelId,
    channelName,
    viewerId: prize.viewer_id,
  });
  await persistInput({ prizeId, input, role: "viewer" });
  await sendPubsubMessage(channelId, "activePrizeUpdate");
}
