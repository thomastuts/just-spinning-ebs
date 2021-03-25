import jwt from "jsonwebtoken";

const EXTENSION_SECRET = Buffer.from(
  process.env.TWITCH_EXTENSION_SECRET,
  "base64"
);

export default function getFakeAuthTokenForChannelId(req, res) {
  const { channel_id, user_id } = req.query;

  const token = jwt.sign(
    {
      exp: Date.now() * 2,
      opaque_user_id: "FAKE_USER",
      role: "broadcaster",
      pubsub_perms: { listen: ["broadcast", "global"] },
      channel_id,
      user_id,
      iat: Date.now()
    },
    EXTENSION_SECRET,
    {
      algorithm: "HS256"
    }
  );

  res.json({
    token
  });
}
