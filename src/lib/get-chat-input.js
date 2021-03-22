import { getClient } from "./tmi.js";

// TODO: add timeout functionality?
export default function getChatInput({
  channelId,
  channelName,
  viewerId,
  validate,
}) {
  return new Promise((resolve, reject) => {
    const client = getClient({ channels: [channelName] });

    client.connect();

    client.on("message", (channel, tags, message, self) => {
      const messageViewerId = tags["user-id"];
      const isMessageFromViewer = messageViewerId === viewerId;
      const isCommand = message.trim().startsWith("!s");

      if (isMessageFromViewer && isCommand) {
        const messageContent = message.replace("!s", "").trim();
        const isValid = validate(messageContent, { viewerId });

        if (isValid) {
          client.disconnect();
          return resolve(messageContent);
        }
      }
    });
  });
}
