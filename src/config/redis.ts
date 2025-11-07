import { createClient } from "redis";
import { env } from "./env.js";

const redisClient = createClient({
  url: env.redis.url
});

redisClient.on("error", (err: unknown) => {
  console.error("Redis Client Error:", err);
  process.exit(-1);
})

await redisClient.connect();

export default redisClient;

