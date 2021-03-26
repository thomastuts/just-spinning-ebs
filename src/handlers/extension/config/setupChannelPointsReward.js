import axios from "axios";
import path from "path";

import db from "../../../lib/db.js";
import { getUserByUserId } from "../../../lib/twitch-api.js";

//https://localhost/#access_token=tp9d8bsnfrogr65lelachu0cyxx6br&scope=channel%3Amanage%3Aredemptions&token_type=bearer
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

    // TODO: create custom reward
    const { data: customRewardCreationData } = await axios.post(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${userInfo.sub}`,
      {
        title: "Just Spinning",
        cost: 250, // TODO: custom values given from extension?
      },
      {
        headers: {
          ...authHeaders,
          "Client-ID": process.env.TWITCH_API_CLIENT_ID,
        },
      }
    );

    const userData = await getUserByUserId(userInfo.sub);

    // TODO: update if exists?
    await db("channels").insert({
      channel_id: userData.id,
      channel_display_name: userData.display_name,
      profile_image_url: userData.profile_image_url,
      reward_id: customRewardCreationData.data[0].id,
    });
  } catch (err) {
    console.log(err);
    // TODO: error handling in case broadcaster can't use custom rewards
    console.log(err);
    console.log(err.response);
    return res.sendFile(
      path.join(process.cwd(), "src/views/setup-reward-fail.html")
    );
  }

  return res.sendFile(
    path.join(process.cwd(), "src/views/setup-reward-success.html")
  );
}
