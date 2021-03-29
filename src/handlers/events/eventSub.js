import db from "../../lib/db.js";
import { getUserByUserId } from "../../lib/twitch-api.js";
import sendPubsubMessage from "../../lib/send-pubsub-message.js";

export default async function eventSub(req, res) {
  if (
    req.headers["twitch-eventsub-message-type"] ===
    "webhook_callback_verification"
  ) {
    return res.send(req.body.challenge);
  }

  if (!req.body.event) {
    return res.sendStatus(204);
  }

  console.log("EVENT SUB:");
  console.log(req.body);
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
          redemption_id: event.id,
        });

        await sendPubsubMessage(channelId, "queueUpdate");
      }

      break;
    }
    case "channel.channel_points_custom_reward.remove": {
      await db("channels").delete().where({
        channel_id: channelId,
      });
      break;
    }
  }

  res.sendStatus(204);
}
