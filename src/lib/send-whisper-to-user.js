import { getClient } from "./tmi.js";

export default async function sendWhisperToUser({ username, message }) {
  // TODO: implement and get bot whitelisted for whispers
  return Promise.resolve();
  const client = getClient();
  await client.connect();
  return client.whisper(username, message);
}
