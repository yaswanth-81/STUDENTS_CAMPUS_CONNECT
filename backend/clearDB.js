/**
 * clearDB.js — Drops all documents in every collection.
 * Run with: node clearDB.js  (from the backend folder)
 */
const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://nyaswanth81_db_user:yash7292@cluster0.vob6k0x.mongodb.net/students_connect?retryWrites=true&w=majority";

const COLLECTIONS = [
  "users",
  "works",
  "applications",
  "orders",
  "chats",
  "messages",
  "notifications",
];

async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected.\n");

  const db = mongoose.connection.db;

  for (const col of COLLECTIONS) {
    try {
      const result = await db.collection(col).deleteMany({});
      console.log(`🗑️  ${col}: deleted ${result.deletedCount} document(s)`);
    } catch (e) {
      console.log(`⚠️  ${col}: ${e.message}`);
    }
  }

  console.log("\n✔ Database cleared! Register fresh accounts now.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
