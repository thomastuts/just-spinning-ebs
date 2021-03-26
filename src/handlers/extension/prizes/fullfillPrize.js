import db from "../../../lib/db.js";
import PRIZE_STATUSES from "../../../constants/prize-statuses.js";
import sendPubsubMessage from "../../../lib/send-pubsub-message.js";

export default async function fulfillPrize(req, res) {
  try {
    const prizeId = req.params.prizeId;
    const channelId = req.token.channel_id;
    const prize = await db("prizes")
      .where({
        id: prizeId,
        channel_id: channelId,
      })
      .first();

    if (!prize) {
      return res.sendStatus(404);
    }

    // Mark queued prize as in progress
    await db("prizes")
      .where({
        id: prizeId,
      })
      .update({
        status: PRIZE_STATUSES.COMPLETED,
      });

    // remove prize channel data
    await db("channels")
      .where({
        channel_id: channelId,
      })
      .update({
        active_prize_id: null,
      });

    // broadcast active prize update
    await sendPubsubMessage(channelId, "activePrizeUpdate");
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}
