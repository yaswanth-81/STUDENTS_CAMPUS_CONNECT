const mongoose = require("mongoose");

async function repairUserOptionalUniqueIndexes(db) {
  try {
    const collections = await db.listCollections({ name: "users" }).toArray();
    if (collections.length === 0) return;

    const users = db.collection("users");
    const indexes = await users.indexes();
    const optionalUniqueIndexes = [
      { name: "email_1", key: { email: 1 }, label: "email" },
      { name: "username_1", key: { username: 1 }, label: "username" },
    ];

    for (const target of optionalUniqueIndexes) {
      const idx = indexes.find((item) => item.name === target.name);
      // Older data may have non-sparse unique indexes, which reject multiple null values.
      if (idx?.unique && !idx?.sparse) {
        await users.dropIndex(target.name);
        await users.createIndex(target.key, {
          name: target.name,
          unique: true,
          sparse: true,
        });
        console.log(`Repaired users.${target.label} index to unique+sparse`);
      }
    }
  } catch (error) {
    console.warn(`Index repair skipped: ${error.message}`);
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await repairUserOptionalUniqueIndexes(conn.connection.db);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
