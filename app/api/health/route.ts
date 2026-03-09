import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
    const status = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
        services: {
            database: { status: "unknown", error: undefined as string | undefined },
            redis: { status: "unknown", error: undefined as string | undefined },
        },
        env: process.env.NODE_ENV,
    };

    // 1. Check Database
    try {
        await prisma.$queryRaw`SELECT 1`;
        status.services.database.status = "up";
    } catch (error) {
        status.services.database.status = "down";
        status.services.database.error = error instanceof Error ? error.message : String(error);
    }

    // 2. Check Redis
    try {
        const redis = getRedis();
        await redis.ping();
        status.services.redis.status = "up";
    } catch (error) {
        status.services.redis.status = "down";
        status.services.redis.error = error instanceof Error ? error.message : String(error);
    }

    const isUp = status.services.database.status === "up" && status.services.redis.status === "up";

    return NextResponse.json(status, { status: isUp ? 200 : 503 });
}
