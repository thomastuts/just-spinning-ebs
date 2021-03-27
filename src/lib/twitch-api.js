import axios from "axios";
import { config } from "dotenv";

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
    type: "channel.follow",
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
