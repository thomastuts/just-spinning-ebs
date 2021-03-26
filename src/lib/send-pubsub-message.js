import Pusher from "pusher";
import { config } from "dotenv";
import sendTwitchChannelBroadcast from "./send-twitch-broadcast.js";

config();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "eu",
  useTLS: true,
});

export default function sendPubsubMessage(channelId, event, payload = {}) {
  return Promise.all([
    pusher.trigger(channelId, event, payload),
    sendTwitchChannelBroadcast({ channelId, event, data: payload }),
  ]);
}
