import { headers } from "next/headers";

/**
 * Helper to get client IP for rate limiting on the server
 */
export async function getClientIp(): Promise<string> {
    try {
        const headerList = await headers();
        const forwarded = headerList.get("x-forwarded-for");
        if (forwarded) return forwarded.split(",")[0];
    } catch (e) {
        // Fallback for non-request contexts
    }
    return "127.0.0.1";
}

/**
 * Production-ready error logger
 */
export function logError(context: string, error: unknown) {
    if (process.env.NODE_ENV === "production") {
        // In production, you would send this to Sentry/Logtail/etc.
        console.error(`[Error][${context}]`, {
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
    } else {
        console.error(`❌ [${context}]`, error);
    }
}
