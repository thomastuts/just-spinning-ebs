import db from "../../lib/db.js";
import { getUserByUserId } from "../../lib/twitch-api.js";
import sendPusherMessage from "../../lib/send-pusher-message.js";

export default async function eventSub(req, res) {
  if (
    req.body.subscription.type ===
    "channel.channel_points_custom_reward_redemption.add"
  ) {
    const event = req.body.event;
    const channelId = event.broadcaster_user_id;

    const channel = await db("channels")
      .where({
        channel_id: channelId,
      })
      .first();

    if (channel && event.reward.id === channel.reward_id) {
      const viewerId = event.user_id;
      console.log(viewerId);
      const viewer = await getUserByUserId(viewerId);
      await db("prizes").insert({
        channel_id: channelId,
        viewer_id: viewerId,
        viewer_display_name: viewer.display_name,
        viewer_profile_image_url: viewer.profile_image_url,
      });

      await sendPusherMessage(channelId, "queueUpdate");
    }
  }

  res.sendStatus(204);
}
