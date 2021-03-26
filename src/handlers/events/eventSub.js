import db from "../../lib/db.js";
import { getUserByUserId } from "../../lib/twitch-api.js";
import sendPubsubMessage from "../../lib/send-pubsub-message.js";

export default async function eventSub(req, res) {
  const event = req.body.event;
  const channelId = event.broadcaster_user_id;

  switch (req.body.subscription.type) {
    case "channel.channel_points_custom_reward_redemption.add": {
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

        await sendPubsubMessage(channelId, "queueUpdate");
      }

      break;
    }
    case "channel.channel_points_custom_reward_redemption.remove": {
      await db("channels").delete().where({
        channel_id: channelId,
      });
      break;
    }
  }

  res.sendStatus(204);
}
