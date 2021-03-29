import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";

import { init } from "./lib/twitch-api.js";
import { start } from "./prizes/legs-or-hotdogs.js";

config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

import eventSub from "./handlers/events/eventSub.js";
import getChannel from "./handlers/viewer/config/getChannel.js";
import getQueuedPrizes from "./handlers/extension/prizes/getQueuedPrizes.js";
import startPrize from "./handlers/extension/prizes/startPrize.js";
import fulfillPrize from "./handlers/extension/prizes/fullfillPrize.js";
import getActivePrizeExtension from "./handlers/extension/prizes/getActivePrize.js";
import getActivePrizeViewer from "./handlers/viewer/prizes/getActivePrize.js";
import getFakeAuthTokenForChannelId from "./handlers/dev/getFakeAuthTokenForChannelId.js";
import { createAuthTokenMiddleware } from "./middleware.js";
import getChannelConfig from "./handlers/extension/config/getChannelConfig.js";
import setupChannelPointsReward from "./handlers/extension/config/setupChannelPointsReward.js";
import refundPrize from "./handlers/extension/prizes/refundPrize.js";

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

  // Extension API routes
  app.get("/ext/config", [authTokenRequiredMiddleware], getChannelConfig);
  app.get("/ext/queue", [authTokenRequiredMiddleware], getQueuedPrizes);
  app.get(
    "/ext/active-prize",
    [authTokenRequiredMiddleware],
    getActivePrizeExtension
  );
  app.get("/ext/setup-channel-points-reward", setupChannelPointsReward);
  app.post(
    "/ext/prizes/:prizeId/start",
    [authTokenRequiredMiddleware],
    startPrize
  );
  app.post(
    "/ext/prizes/:prizeId/fulfill",
    [authTokenRequiredMiddleware],
    fulfillPrize
  );
  app.post(
    "/ext/prizes/:prizeId/refund",
    [authTokenRequiredMiddleware],
    refundPrize
  );
  app.get("/ext/debug/fake-auth-token", getFakeAuthTokenForChannelId);

  // Viewer API routes
  app.get("/viewer/channels/:channelId", getChannel);
  app.get("/viewer/channels/:channelId/active-prize", getActivePrizeViewer);

  // Other routes
  app.post("/eventsub", eventSub);

  app.listen(process.env.PORT, () => {
    console.log(
      `Just Spinning EBS listening at http://localhost:${process.env.PORT}`
    );

    // setTimeout(() => {
    //   start(17, "StreamingToolsmith");
    // }, 500);
  });
})();
