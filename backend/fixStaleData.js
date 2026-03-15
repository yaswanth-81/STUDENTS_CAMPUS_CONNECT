/**
 * fixStaleData.js — Patches stale work/order statuses after payment confirmation.
 * Sets work.status = "completed" for any work that has a paid order.
 * Run: node fixStaleData.js
 */
const mongoose = require("mongoose");
const MONGO_URI = "mongodb+srv://nyaswanth81_db_user:yash7292@cluster0.vob6k0x.mongodb.net/students_connect?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Find orders where payment was confirmed (notification says so) but work status not updated
  // Check orders that have "completed" status
  const completedOrders = await db.collection("orders").find({
    status: "completed"
  }).toArray();

  console.log(`Found ${completedOrders.length} completed order(s)`);

  for (const order of completedOrders) {
    // Update work status to completed
    const result = await db.collection("works").updateOne(
      { _id: order.workId },
      { $set: { status: "completed" } }
    );
    console.log(`Work ${order.workId}: updated=${result.modifiedCount}`);
  }

  // Also check if any work has paymentStatus != unpaid
  const paidOrders = await db.collection("orders").find({
    paymentStatus: { $in: ["paid_online", "paid_meeting"] }
  }).toArray();

  console.log(`\nFound ${paidOrders.length} paid order(s)`);

  for (const order of paidOrders) {
    const result = await db.collection("works").updateOne(
      { _id: order.workId },
      { $set: { status: "completed" } }
    );
    // Also ensure order status is completed
    await db.collection("orders").updateOne(
      { _id: order._id },
      { $set: { status: "completed" } }
    );
    console.log(`Work ${order.workId}: updated=${result.modifiedCount}`);
  }

  // Check for orders that have sent payment confirmation system messages
  // (chat message with type payment_done means payment was confirmed)
  const chats = await db.collection("chats").find({}).toArray();
  for (const chat of chats) {
    const paymentMsg = await db.collection("messages").findOne({
      chatId: chat._id,
      messageType: "payment_done"
    });
    if (paymentMsg) {
      const order = await db.collection("orders").findOne({ _id: chat.orderId });
      if (order) {
        await db.collection("works").updateOne(
          { _id: order.workId },
          { $set: { status: "completed" } }
        );
        await db.collection("orders").updateOne(
          { _id: order._id },
          { $set: { status: "completed" } }
        );
        console.log(`\nFixed via chat message: order ${order._id}, work ${order.workId}`);
      }
    }
  }

  // Final state
  const works = await db.collection("works").find({}).toArray();
  console.log("\nFinal work statuses:");
  for (const w of works) {
    console.log(`  "${w.title}": ${w.status}`);
  }
  const orders = await db.collection("orders").find({}).toArray();
  console.log("\nFinal order statuses:");
  for (const o of orders) {
    const w = await db.collection("works").findOne({ _id: o.workId });
    console.log(`  "${w?.title}": order=${o.status}, payment=${o.paymentStatus || "unpaid"}`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(e => { console.error(e.message); process.exit(1); });
