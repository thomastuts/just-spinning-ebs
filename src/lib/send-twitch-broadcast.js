import axios from "axios";
import jwt from "jsonwebtoken";
import Pusher from "pusher";

const EXTENSION_SECRET = Buffer.from(
  process.env.TWITCH_EXTENSION_SECRET,
  "base64"
);

function sendFakePusherPubSubBroadcast({ channelId, event, data }) {
  const pusher = new Pusher({
    appId: process.env.FAKE_PUBSUB_PUSHER_APP_ID,
    key: process.env.FAKE_PUBSUB_PUSHER_KEY,
    secret: process.env.FAKE_PUBSUB_PUSHER_SECRET,
    cluster: "eu",
    encrypted: true,
  });

  return pusher.trigger(
    channelId,
    "broadcast",
    JSON.stringify({ event, payload: data })
  );
}

export default async function sendTwitchChannelBroadcast({
  channelId,
  event,
  data,
}) {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    channel_id: channelId,
    user_id: process.env.TWITCH_EXTENSION_OWNER_ID.toString(),
    role: "external",
    pubsub_perms: {
      send: ["*"],
    },
  };

  const serverToken = jwt.sign(payload, EXTENSION_SECRET, {
    algorithm: "HS256",
  });

  const headers = {
    "Client-ID": process.env.TWITCH_API_CLIENT_ID,
    "Content-Type": "application/json",
    Authorization: `Bearer ${serverToken}`,
  };

  return axios.post(
    `https://api.twitch.tv/extensions/message/${channelId}`,
    {
      content_type: "application/json",
      message: JSON.stringify({
        event,
        payload: data,
      }),
      targets: ["broadcast"],
    },
    {
      headers,
    }
  );
}
