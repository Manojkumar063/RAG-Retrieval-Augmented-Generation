import { config } from "../config/env.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    error: config.nodeEnv === "production" ? "Internal server error" : err.message,
  });
}
