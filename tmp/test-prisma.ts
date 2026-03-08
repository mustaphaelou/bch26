import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking database connection...");
        await prisma.$connect();
        console.log("Connected successfully.");

        console.log("Fetching fournisseurs...");
        const fournisseurs = await prisma.fournisseur.findMany();
        console.log("Found:", fournisseurs.length);
        console.log(JSON.stringify(fournisseurs, null, 2));
    } catch (error) {
        const err = error as Error & { code?: string; meta?: Record<string, unknown> };
        console.error("PRISMA ERROR:");
        console.error("Message:", err.message);
        if (err.code) console.error("Code:", err.code);
        if (err.meta) console.error("Meta:", JSON.stringify(err.meta));
        console.error("Stack:", err.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
