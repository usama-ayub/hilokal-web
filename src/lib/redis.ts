import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "redispassword123";

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined;
}

/**
 * Singleton Redis Client for Presence, In-Memory State, and Hand-Raise Queues
 */
export function getRedisClient(): Redis {
  if (!global.redisClient) {
    global.redisClient = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    global.redisClient.on("connect", () => {
      console.log("Redis client connected successfully");
    });

    global.redisClient.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });
  }

  return global.redisClient;
}

export const redis = getRedisClient();
