import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            retryStrategy(times) {
                // Reconnect after a delay, max 2 seconds
                return Math.min(times * 50, 2000);
            },
            // Reduce timeout for internal connect
            connectTimeout: 5000,
        });

        // Handle error event to prevent unhandled exceptions
        redis.on("error", (err) => {
            // We only log the message to avoid drowning logs in stack traces
            console.error(`[Redis] Connection Error: ${err.message}`);
        });

        redis.on("connect", () => {
            console.info("[Redis] Connected to server");
        });
    }
    return redis;
}

export { redis };
