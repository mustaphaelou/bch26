import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

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

    if (databaseUrl) {
        const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ":****@");
        console.log("✅ [Prisma Debug] DATABASE_URL found:", maskedUrl);
    } else {
        console.error("❌ CRITICAL ERROR: DATABASE_URL is not defined in the environment!");
        console.log("🔍 [Prisma Debug] CWD:", process.cwd());
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
