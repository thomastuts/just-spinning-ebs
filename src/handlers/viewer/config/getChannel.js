import db from "../../../lib/db.js";

export default async function (req, res) {
  const { channelId } = req.params;

  const channel = await db("channels")
    .where({
      channel_id: channelId,
    })
    .first();

  if (!channel) {
    return res.sendStatus(404);
  }

  return res.json(channel);
}
