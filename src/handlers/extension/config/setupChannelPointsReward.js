import axios from "axios";
import path from "path";

import db from "../../../lib/db.js";

//https://localhost/#access_token=tp9d8bsnfrogr65lelachu0cyxx6br&scope=channel%3Amanage%3Aredemptions&token_type=bearer
export default async function setupChannelPointsReward(req, res) {
  console.log(req.query);

  try {
    const { data } = await axios.post(
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
    console.log(data);

    // TODO: get user info from token (to get channel ID)

    // TODO: create custom reward

    // TODO: set up in database
  } catch (err) {
    // TODO: error handling in case broadcaster can't use custom rewards
    console.log(err.response);
  }

  return res.sendFile(
    path.join(process.cwd(), "src/views/setup-reward-success.html")
  );
}
