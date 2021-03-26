import db from "../../../lib/db.js";
import { getUserByUserId } from "../../../lib/twitch-api.js";

export default async function getChannelConfig(req, res) {
  const channel = await db("channels")
    .where({
      channel_id: req.token.user_id,
    })
    .first();

  if (!channel) {
    return res.sendStatus(404);
  }

  return res.json(channel);
}
