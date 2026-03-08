import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
    const databaseUrl = process.env.DATABASE_URL;

    console.log("🔍 [Prisma Debug] DATABASE_URL from process.env:", !!databaseUrl);

    // Log related env vars to see what's available
    const relatedVars = Object.keys(process.env).filter(k => k.startsWith("DB") || k.includes("DATABASE") || k.startsWith("POSTGRES"));
    console.log("🔍 [Prisma Debug] Related env vars found:", relatedVars);

    if (!databaseUrl) {
        console.error("❌ CRITICAL ERROR: DATABASE_URL is not defined in the environment!");
    } else {
        const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ":****@");
        console.log("✅ [Prisma Debug] DATABASE_URL found:", maskedUrl);
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
