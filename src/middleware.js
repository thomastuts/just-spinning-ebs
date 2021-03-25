import jwt from "jsonwebtoken";

// import db from "./db";
// import getHeaderFromHeaders from "./util/get-header-from-headers";
// import { isFeatureEnabled } from "./util/feature-check";

// const getChannelIdFromSecret = async (secret) => {
//   const channelSecretEntry = await db("channel_secrets")
//     .where({ secret: secret })
//     .first();
//   return channelSecretEntry ? channelSecretEntry.channel_id : null;
// };

export function createAuthTokenMiddleware({ isTokenRequired = true }) {
  return (req, res, next) => {
    const secret = Buffer.from(process.env.TWITCH_EXTENSION_SECRET, "base64");

    try {
      const token = req.headers.authorization.replace("Bearer ", "");
      const decodedToken = jwt.decode(token, secret, {
        algorithms: ["HS256"],
      });

      if (!decodedToken && isTokenRequired) {
        return res.status(401).json({
          error_code: "ERR_INVALID_AUTH_HEADER",
          error_message:
            "The token in the Authorization header is either missing or invalid.",
        });
      }

      req.token = decodedToken;
      next();
    } catch (err) {
      if (!isTokenRequired) {
        return next();
      }

      return res.status(401).json({
        error_code: "ERR_INVALID_AUTH_HEADER",
        error_message:
          "The token in the Authorization header is either missing or invalid.",
      });
    }
  };
}

export function createAclMiddleware({ allowedRoles = [] }) {
  return function (req, res, next) {
    if (!allowedRoles.includes(req.token.role)) {
      return res.status(400).json({
        error_code: "ERR_INVALID_ROLE",
        error_message: `This action can only be performed by the following roles: ${allowedRoles.join(
          ", "
        )}`,
      });
    }
    next();
  };
}
