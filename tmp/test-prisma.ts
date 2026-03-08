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
    } catch (error: any) {
        console.error("PRISMA ERROR:");
        console.error("Message:", error.message);
        if (error.code) console.error("Code:", error.code);
        if (error.meta) console.error("Meta:", JSON.stringify(error.meta));
        console.error("Stack:", error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
