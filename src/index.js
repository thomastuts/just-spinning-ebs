import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";

import { init } from "./lib/twitch-api.js";

config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

import eventSub from "./handlers/events/eventSub.js";
import getChannel from "./handlers/getChannel.js";
import getQueuedPrizes from "./handlers/prizes/getQueuedPrizes.js";
import startPrize from "./handlers/prizes/startPrize.js";
import fulfillPrize from "./handlers/prizes/fullfillPrize.js";
import getActivePrize from "./handlers/prizes/getActivePrize.js";
import getFakeAuthTokenForChannelId from "./handlers/dev/getFakeAuthTokenForChannelId.js";
import { createAuthTokenMiddleware } from "./middleware.js";
import getChannelConfig from "./handlers/config/getChannelConfig.js";
import setupChannelPointsReward from "./handlers/config/setupChannelPointsReward.js";

const authTokenRequiredMiddleware = createAuthTokenMiddleware({
  isTokenRequired: true,
});

(async () => {
  await init();

  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  app.post("/", (req, res) => {
    console.log(req.body);
    res.send(req.body || "No body.");
  });

  app.get("/debug/fake-auth-token", getFakeAuthTokenForChannelId);
  app.post("/eventsub", eventSub);
  app.get("/channels/:channelId", getChannel);
  app.get("/channels/:channelId/active-prize", getActivePrize);
  app.get("/setup-channel-points-reward", setupChannelPointsReward);
  app.get("/queue", [authTokenRequiredMiddleware], getQueuedPrizes);
  app.post("/queue/:prizeId/start", [authTokenRequiredMiddleware], startPrize);
  app.get("/config", [authTokenRequiredMiddleware], getChannelConfig);
  app.post("/:channelId/prizes/:prizeId/fulfill", fulfillPrize);

  app.listen(process.env.PORT, () => {
    console.log(
      `Just Spinning EBS listening at http://localhost:${process.env.PORT}`
    );
  });
})();
