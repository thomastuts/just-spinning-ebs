import db from "../../lib/db.js";
import PRIZE_STATUSES from "../../constants/prize-statuses.js";
import PRIZE_TYPES from "../../constants/prize-types.js";
import sendPusherMessage from "../../lib/send-pusher-message.js";
import sleep from "../../lib/sleep.js";
import * as legsOrHotdogsPrize from "../../prizes/legs-or-hotdogs.js";
import * as icebreakerPrize from "../../prizes/icebreaker.js";
import * as guessTheWordPrize from "../../prizes/guess-the-word.js";
import * as fillInTheBlankPrize from "../../prizes/fill-in-the-blank.js";

const prizeLogicByPrizeType = {
  [PRIZE_TYPES.LEGS_OR_HOTDOGS_QUIZ]: legsOrHotdogsPrize,
  [PRIZE_TYPES.ICEBREAKER]: icebreakerPrize,
  [PRIZE_TYPES.GUESS_THE_WORD]: guessTheWordPrize,
  [PRIZE_TYPES.FILL_IN_THE_BLANK]: fillInTheBlankPrize,
};

export default async function startPrize(req, res) {
  try {
    const prizeId = req.params.prizeId;
    const channelId = req.token.channel_id;
    const prize = await db("prizes")
      .where({
        id: prizeId,
        channel_id: channelId,
        status: PRIZE_STATUSES.QUEUED,
      })
      .first();

    if (!prize) {
      return res.sendStatus(404);
    }

    // TODO: implement prize randomization
    const randomPrizeType = PRIZE_TYPES.GUESS_THE_WORD;

    const channel = await db("channels")
      .where({
        channel_id: channelId,
      })
      .first();

    if (!channel) {
      await db("channels").insert({
        channel_id: channelId,
      });
    }

    // Mark queued prize as in progress
    await db("prizes")
      .where({
        id: prizeId,
      })
      .update({
        status: PRIZE_STATUSES.IN_PROGRESS,
        type: randomPrizeType,
      });

    // add prize to channel data
    await db("channels")
      .where({
        channel_id: channelId,
      })
      .update({
        active_prize_id: prizeId,
      });

    await sendPusherMessage(channelId, "prizeStartAnimation", {
      ...prize,
      type: randomPrizeType,
      status: PRIZE_STATUSES.IN_PROGRESS,
    });

    await sleep(6500);

    // broadcast active prize update
    await sendPusherMessage(channelId, "activePrizeUpdate");

    const prizeLogic = prizeLogicByPrizeType[randomPrizeType];

    prizeLogic.start(prizeId);

    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}
