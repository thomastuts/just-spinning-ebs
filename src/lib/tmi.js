import tmi from "tmi.js";

export function getClient({ channels }) {
  return new tmi.Client({
    connection: { reconnect: true },
    channels: channels,
  });
}
