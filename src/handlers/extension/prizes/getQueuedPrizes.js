import db from "../../../lib/db.js";
import PRIZE_STATUSES from "../../../constants/prize-statuses.js";

export default async function getQueuedPrizes(req, res) {
  try {
    const queue = await db("prizes").where({
      channel_id: req.token.channel_id,
      status: PRIZE_STATUSES.QUEUED,
    });
    return res.json(queue);
  } catch {
    return res.sendStatus(500);
  }
}
