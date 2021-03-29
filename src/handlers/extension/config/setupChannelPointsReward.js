import axios from "axios";
import path from "path";

import db from "../../../lib/db.js";
import {
  createEventSubSubscription,
  getUserByUserId,
} from "../../../lib/twitch-api.js";
import sendPubsubMessage from "../../../lib/send-pubsub-message.js";

export default async function setupChannelPointsReward(req, res) {
  try {
    const { data: tokenData } = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: process.env.TWITCH_API_CLIENT_ID,
          client_secret: process.env.TWITCH_API_CLIENT_SECRET,
          code: req.query.code,
          grant_type: "authorization_code",
          redirect_uri: "https://localhost", // TODO
        },
      }
    );

    // TODO: get user info from token (to get channel ID)
    const authHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
    };

    const { data: userInfo } = await axios.get(
      "https://id.twitch.tv/oauth2/userinfo",
      {
        headers: authHeaders,
      }
    );

    const { data: customRewardCreationData } = await axios.post(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${userInfo.sub}`,
      {
        // TODO: expand these fields
        title: "Just Spinning - Spin the Wheel",
        cost: 250,
        background_color: "#37C7F1",
      },
      {
        headers: {
          ...authHeaders,
          "Client-ID": process.env.TWITCH_API_CLIENT_ID,
        },
      }
    );

    await db("tokens").where({ channel_id: userInfo.sub });
    await db("tokens").insert({
      channel_id: userInfo.sub,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    await Promise.all([
      createEventSubSubscription({
        type: "channel.channel_points_custom_reward_redemption.add",
        channelId: userInfo.sub,
      }),
      createEventSubSubscription({
        type: "channel.channel_points_custom_reward.remove",
        channelId: userInfo.sub,
      }),
    ]);

    const userData = await getUserByUserId(userInfo.sub);

    await db("channels").insert({
      channel_id: userData.id,
      channel_display_name: userData.display_name,
      profile_image_url: userData.profile_image_url,
      reward_id: customRewardCreationData.data[0].id,
    });

    await sendPubsubMessage(userInfo.sub, "configUpdate");

    return res.sendFile(
      path.join(process.cwd(), "src/views/setup-reward-success.html")
    );
  } catch (err) {
    console.log(err);
    // TODO: error handling in case broadcaster can't use custom rewards
    console.log(err);
    console.log(err.response);
    return res.sendFile(
      path.join(process.cwd(), "src/views/setup-reward-fail.html")
    );
  }
}
