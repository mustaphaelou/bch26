import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error("CRITICAL ERROR: DATABASE_URL is not defined in the environment!");
    } else {
        console.log("DATABASE_URL found, length:", databaseUrl.length);
    }

    const pool = new pg.Pool({
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000, // Increased timeout for docker networking
    });

    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    // Graceful shutdown
    if (typeof process !== "undefined") {
        process.on("beforeExit", async () => {
            await client.$disconnect();
            await pool.end();
        });
    }

    return client;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
