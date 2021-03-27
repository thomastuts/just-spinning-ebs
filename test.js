import { init, createEventSubSubscription } from "./src/lib/twitch-api.js";

(async () => {
  await init();
  await createEventSubSubscription({
    type: "channel.follow",
    channelId: "12826",
  });
})();
