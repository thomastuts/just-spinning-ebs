import db from "../../lib/db.js";

export default async function getActivePrize(req, res) {
  try {
    const channel = await db("channels")
      .where({ channel_id: req.params.channelId })
      .first();

    if (!channel || (channel && !channel.active_prize_id)) {
      return res.sendStatus(404);
    }

    const prize = await db("prizes")
      .where({ id: channel.active_prize_id })
      .first();

    if (!prize) {
      return res.sendStatus(404);
    }

    return res.json(prize);
  } catch {
    return res.sendStatus(500);
  }
}
