import tmi from "tmi.js";

export function getClient({ channels }) {
  return new tmi.Client({
    identity: {
      username: process.env.CHATBOT_USERNAME,
      password: process.env.CHATBOT_OAUTH_TOKEN,
    },
    connection: { reconnect: true },
    channels: channels,
  });
}
