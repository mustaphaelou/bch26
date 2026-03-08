import { getRedis } from "./redis";

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Simple Rate Limiter using Redis INCR and EXPIRE
 * @param identifier Unique key (e.g., IP address or User ID)
 * @param limit Max requests allowed
 * @param window Duration in seconds
 */
export async function rateLimit(
    identifier: string,
    limit: number = 100,
    window: number = 60
): Promise<RateLimitResult> {
    const redis = getRedis();
    const key = `rate_limit:${identifier}`;

    try {
        const current = await redis.get(key);
        const count = current ? parseInt(current) : 0;

        if (count >= limit) {
            const ttl = await redis.ttl(key);
            return {
                success: false,
                limit,
                remaining: 0,
                reset: ttl > 0 ? ttl : window,
            };
        }

        const multi = redis.multi();
        multi.incr(key);
        if (!current) {
            multi.expire(key, window);
        }

        const results = await multi.exec();
        const newCount = results ? (results[0][1] as number) : count + 1;

        return {
            success: true,
            limit,
            remaining: Math.max(0, limit - newCount),
            reset: window, // simplified reset for this implementation
        };
    } catch (error) {
        console.error("Rate limit error:", error);
        // Fail open if Redis is down (or closed) to ensure availability
        return {
            success: true,
            limit,
            remaining: limit,
            reset: 0,
        };
    }
}
