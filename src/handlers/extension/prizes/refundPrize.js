import db from "../../../lib/db.js";
import PRIZE_STATUSES from "../../../constants/prize-statuses.js";
import sendPubsubMessage from "../../../lib/send-pubsub-message.js";
import { updateRedemptionStatus } from "../../../lib/twitch-api.js";

export default async function refundPrize(req, res) {
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

    const channel = await db("channels")
      .where({ channel_id: channelId })
      .first();

    await updateRedemptionStatus({
      redemptionId: prize.redemption_id,
      broadcasterId: channelId,
      rewardId: channel.reward_id,
      status: "CANCELED",
    });

    // Mark queued prize as completed
    await db("prizes")
      .where({
        id: prizeId,
      })
      .update({
        status: PRIZE_STATUSES.REFUNDED,
      });

    // remove prize in channel data
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
    if (err.response) {
      console.log(err.response);
    }
    res.sendStatus(500);
  }
}
