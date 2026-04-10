import "dotenv/config";

const required = ["GEMINI_API_KEY", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

export const config = {
  port: process.env.PORT || 3001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
};
