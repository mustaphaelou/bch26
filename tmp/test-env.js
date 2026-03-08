import "dotenv/config";
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("Val (masked):", process.env.DATABASE_URL.replace(/:([^@]+)@/, ":****@"));
}
console.log("All keys:", Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("NODE")));
