import axios from "axios";
import { config } from "dotenv";

import db from "./db.js";

config();

const getAccessToken = async () => {
  console.log("Twitch API init:", {
    params: {
      client_id: process.env.TWITCH_API_CLIENT_ID,
      client_secret: process.env.TWITCH_API_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_API_CLIENT_ID,
      client_secret: process.env.TWITCH_API_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  console.log(response.data);

  return response.data.access_token;
};

let helixClient;

export const init = async () => {
  const accessToken = await getAccessToken();

  helixClient = axios.create({
    baseURL: "https://api.twitch.tv/helix",
    headers: {
      "Client-ID": process.env.TWITCH_API_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return Promise.resolve();
};

export const getChannelIdByChannelName = async (channelName) => {
  // TODO: implement caching?
  const { data } = await helixClient.get("/users", {
    params: { login: channelName },
  });

  if (!data.data || data.data.length === 0) {
    return null;
  }

  return data.data[0].id;
};

export const getUserByUserId = async (id) => {
  console.log("Getting user:", id);
  // TODO: implement caching?
  const { data } = await helixClient.get("/users", {
    params: { id: id },
  });

  if (!data.data || data.data.length === 0) {
    return null;
  }

  return data.data[0];
};

export const createEventSubSubscription = async ({ type, channelId }) => {
  const payload = {
    type: type,
    version: "1",
    condition: {
      broadcaster_user_id: channelId,
    },
    transport: {
      method: "webhook",
      callback: process.env.TWITCH_EVENTSUB_CALLBACK_URL,
      secret: process.env.TWITCH_EVENTSUB_SECRET,
    },
  };

  console.log("Creating event subscription:", payload);

  try {
    const { data: subscriptionResponse } = await helixClient.post(
      "/eventsub/subscriptions",
      payload
    );
    console.log("Created event subscription successfully.");
  } catch (err) {
    console.log("Error creating event subscription:");
    console.log(err.response);
  }
};

export const refreshOAuthTokenForChannelId = async (channelId) => {
  console.log("Refreshing OAuth token for channel", channelId);
  const tokenData = await db("tokens").where({ channel_id: channelId }).first();
  const { data: updatedTokenData } = await axios.post(
    "https://id.twitch.tv/oauth2/token",
    {},
    {
      params: {
        grant_type: "refresh_token",
        refresh_token: tokenData.refresh_token,
        client_id: process.env.TWITCH_API_CLIENT_ID,
        client_secret: process.env.TWITCH_API_CLIENT_SECRET,
      },
    }
  );

  console.log("Updating tokens in DB for channel", channelId);
  await db("tokens").where({ channel_id: channelId }).update({
    access_token: updatedTokenData.access_token,
    refresh_token: updatedTokenData.refresh_token,
  });

  return updatedTokenData.access_token;
};

export const updateRedemptionStatus = async ({
  redemptionId,
  rewardId,
  broadcasterId,
  status,
}) => {
  console.log("Updating redemption status:", {
    redemptionId,
    rewardId,
    broadcasterId,
    status,
  });
  const token = await refreshOAuthTokenForChannelId(broadcasterId);

  return helixClient.patch(
    "/channel_points/custom_rewards/redemptions",
    {
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        id: redemptionId,
        broadcaster_id: broadcasterId,
        reward_id: rewardId,
      },
    }
  );
};
