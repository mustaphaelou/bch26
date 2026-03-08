import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
console.log("Using URL:", databaseUrl?.replace(/:([^@]+)@/, ":****@"));

const pool = new pg.Pool({
    connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const count = await prisma.fournisseur.count();
        console.log("Success! Count of fournisseurs:", count);
    } catch (e) {
        console.error("Failed to fetch fournisseurs:", e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
