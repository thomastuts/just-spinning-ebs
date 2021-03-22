import Pusher from "pusher";
import { config } from "dotenv";

config();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "eu",
  useTLS: true,
});

export default function sendPusherMessage(channelId, event, payload = {}) {
  return pusher.trigger(channelId, event, payload);
}
