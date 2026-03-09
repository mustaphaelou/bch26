import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import Decimal from "decimal.js";

/**
 * BigInt and Decimal Serialization Fix
 * Necessary for sending high-precision database types over JSON APIs
 * Using Decimal.js for consistent precision across the app.
 */
(BigInt.prototype as unknown as { toJSON(): string }).toJSON = function () {
    return this.toString();
};

(Decimal.prototype as unknown as { toJSON(): string }).toJSON = function () {
    return this.toString();
};

const prismaClientSingleton = () => {
    const databaseUrl = process.env.DATABASE_URL;

    console.log("🔍 [Prisma Debug] DATABASE_URL from process.env:", !!databaseUrl);

    // Filter and log interesting keys (hiding values)
    const envKeys = Object.keys(process.env);
    const databaseRelatedKeys = envKeys.filter(k =>
        k.includes("DATABASE") ||
        k.includes("URL") ||
        k.startsWith("DB") ||
        k.startsWith("POSTGRES") ||
        k.startsWith("NEXTAUTH")
    );
    console.log("🔍 [Prisma Debug] Keys found in process.env:", databaseRelatedKeys);

    if (databaseUrl && databaseUrl.trim() !== "") {
        const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ":****@");
        console.log("✅ [Prisma Debug] DATABASE_URL found:", maskedUrl);
    } else {
        console.error("❌ CRITICAL ERROR: DATABASE_URL is not defined or is empty!");
        console.log("🔍 [Prisma Debug] Diagnosis:");
        console.log("   - CWD:", process.cwd());
        console.log("   - NODE_ENV:", process.env.NODE_ENV);

        const allKeys = Object.keys(process.env).sort();
        console.log("   - Total Env Keys:", allKeys.length);
        console.log("   - Known Keys found:", allKeys.filter(k => k.includes("URL") || k.includes("DATABASE") || k.includes("COOLIFY")));

        // Reminder: In Next.js standalone mode, .env files are NOT automatically loaded from the filesystem in production.
        // You MUST define DATABASE_URL in your deployment platform (e.g., Coolify's Environment Variables dashboard).
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
        // When using an adapter, we don't pass datasources directly here if the types complain,
        // but we ensure the pool is correctly configured via the databaseUrl above.
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
