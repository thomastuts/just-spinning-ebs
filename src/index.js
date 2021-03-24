import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";

import PRIZE_TYPES from "./constants/prize-types.js";
import PRIZE_STATUSES from "./constants/prize-statuses.js";
import db from "./lib/db.js";
import {
  getChannelIdByChannelName,
  getUserByUserId,
  init,
} from "./lib/twitch-api.js";

config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

import * as legsOrHotdogsPrize from "./prizes/legs-or-hotdogs.js";
import * as icebreakerPrize from "./prizes/icebreaker.js";
import sendWhisperToUser from "./lib/send-whisper-to-user.js";
import sendPusherMessage from "./lib/send-pusher-message.js";
import sleep from "./lib/sleep.js";

const prizeLogicByPrizeType = {
  [PRIZE_TYPES.LEGS_OR_HOTDOGS_QUIZ]: legsOrHotdogsPrize,
  [PRIZE_TYPES.ICEBREAKER]: icebreakerPrize,
};

(async () => {
  await init();

  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  app.post("/", (req, res) => {
    console.log(req.body);
    res.send(req.body || "No body.");
  });

  app.post("/eventsub", async (req, res) => {
    if (
      req.body.subscription.type ===
      "channel.channel_points_custom_reward_redemption.add"
    ) {
      const event = req.body.event;
      const channelId = event.broadcaster_user_id;

      const channel = await db("channels")
        .where({
          channel_id: channelId,
        })
        .first();

      if (channel && event.reward.id === channel.reward_id) {
        const viewerId = event.user_id;
        console.log(viewerId);
        const viewer = await getUserByUserId(viewerId);
        await db("prizes").insert({
          channel_id: channelId,
          viewer_id: viewerId,
          viewer_display_name: viewer.display_name,
          viewer_profile_image_url: viewer.profile_image_url,
        });

        await sendPusherMessage(channelId, "queueUpdate");
      }
    }

    res.sendStatus(204);
  });

  app.get("/channel", async (req, res) => {
    const { channel_name } = req.query;

    if (!channel_name) {
      return res.sendStatus(404);
    }

    const channelId = await getChannelIdByChannelName(channel_name);

    if (!channelId) {
      return res.sendStatus(404);
    }

    const channel = await db("channels")
      .where({
        channel_id: channelId,
      })
      .first();

    if (!channel) {
      return res.sendStatus(404);
    }

    return res.json(channel);
  });

  app.get("/:channelId/queue", async (req, res) => {
    try {
      const queue = await db("prizes").where({
        channel_id: req.params.channelId,
        status: PRIZE_STATUSES.QUEUED,
      });
      return res.json(queue);
    } catch {
      return res.sendStatus(500);
    }
  });

  app.post("/:channelId/prizes/:prizeId/start", async (req, res) => {
    try {
      const prizeId = req.params.prizeId;
      const channelId = req.params.channelId;
      const prize = await db("prizes")
        .where({
          id: prizeId,
          channel_id: channelId,
          status: PRIZE_STATUSES.QUEUED,
        })
        .first();

      if (!prize) {
        return res.sendStatus(404);
      }

      // TODO: implement prize randomization
      const randomPrizeType = PRIZE_TYPES.LEGS_OR_HOTDOGS_QUIZ;

      const channel = await db("channels")
        .where({
          channel_id: channelId,
        })
        .first();

      if (!channel) {
        await db("channels").insert({
          channel_id: channelId,
        });
      }

      // Mark queued prize as in progress
      await db("prizes")
        .where({
          id: prizeId,
        })
        .update({
          status: PRIZE_STATUSES.IN_PROGRESS,
          type: randomPrizeType,
        });

      // add prize to channel data
      await db("channels")
        .where({
          channel_id: channelId,
        })
        .update({
          active_prize_id: prizeId,
        });

      await sendPusherMessage(channelId, "prizeStartAnimation", {
        ...prize,
        type: randomPrizeType,
        status: PRIZE_STATUSES.IN_PROGRESS,
      });

      await sleep(6500);

      // broadcast active prize update
      await sendPusherMessage(channelId, "activePrizeUpdate");

      const prizeLogic = prizeLogicByPrizeType[randomPrizeType];

      prizeLogic.start(prizeId);

      res.sendStatus(204);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  app.post("/:channelId/prizes/:prizeId/fulfill", async (req, res) => {
    try {
      const prizeId = req.params.prizeId;
      const channelId = req.params.channelId;
      const prize = await db("prizes")
        .where({
          id: prizeId,
          channel_id: channelId,
          status: PRIZE_STATUSES.IN_PROGRESS,
        })
        .first();

      if (!prize) {
        return res.sendStatus(404);
      }

      // Mark queued prize as in progress
      await db("prizes")
        .where({
          id: prizeId,
        })
        .update({
          status: PRIZE_STATUSES.COMPLETED,
        });

      // remove prize channel data
      await db("channels")
        .where({
          channel_id: channelId,
        })
        .update({
          active_prize_id: null,
        });

      // broadcast active prize update
      await sendPusherMessage(channelId, "activePrizeUpdate");
      res.sendStatus(204);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  app.get("/:channelId/active-prize", async (req, res) => {
    try {
      const channel = await db("channels")
        .where({ channel_id: req.params.channelId })
        .first();

      if (!channel || (channel && !channel.active_prize_id)) {
        return res.sendStatus(404);
      }

      const prize = await db("prizes")
        .where({ id: channel.active_prize_id })
        .first();

      if (!prize) {
        return res.sendStatus(404);
      }

      return res.json(prize);
    } catch {
      return res.sendStatus(500);
    }
  });

  app.listen(process.env.PORT, () => {
    console.log(
      `Just Spinning EBS listening at http://localhost:${process.env.PORT}`
    );
  });
})();
