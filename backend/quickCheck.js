const mongoose = require("mongoose");
const MONGO_URI = "mongodb+srv://nyaswanth81_db_user:yash7292@cluster0.vob6k0x.mongodb.net/students_connect?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Show ALL works with their _id and status
  const works = await db.collection("works").find({}).toArray();
  console.log("ALL WORKS:");
  for (const w of works) {
    console.log(`  _id=${w._id} title="${w.title}" status=${w.status}`);
    // Show ALL orders matching this workId
    const orders = await db.collection("orders").find({ workId: w._id }).toArray();
    for (const o of orders) {
      const worker = await db.collection("users").findOne({ _id: o.workerId });
      console.log(`    -> Order ${o._id} status=${o.status} worker=${worker?.fullName || worker?.rollNumber}`);
    }
    if (orders.length === 0) console.log("    -> No orders");
  }

  // Also print all orders with their workId to catch any orphan orders
  console.log("\nALL ORDERS:");
  const orders = await db.collection("orders").find({}).toArray();
  for (const o of orders) {
    const work = await db.collection("works").findOne({ _id: o.workId });
    const worker = await db.collection("users").findOne({ _id: o.workerId });
    console.log(`  _id=${o._id} workId=${o.workId} job="${work?.title}" status=${o.status} worker=${worker?.fullName}`);
  }

  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
