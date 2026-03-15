/**
 * verifyDB.js — Prints all orders, works, and their statuses to verify DB integrity.
 * Run: node verifyDB.js
 */
const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://nyaswanth81_db_user:yash7292@cluster0.vob6k0x.mongodb.net/students_connect?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const sep = () => console.log("─".repeat(70));

  // ── Works ──────────────────────────────────────────────────────────────────
  const works = await db.collection("works").find({}).toArray();
  console.log(`\nWORKS (${works.length}):`); sep();
  for (const w of works) {
    console.log(`  [${w.status.toUpperCase()}] "${w.title}" | ₹${w.budget} | _id:${w._id}`);
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  const orders = await db.collection("orders").find({}).toArray();
  console.log(`\nORDERS (${orders.length}):`); sep();
  for (const o of orders) {
    const client = await db.collection("users").findOne({ _id: o.clientId });
    const worker = await db.collection("users").findOne({ _id: o.workerId });
    const work   = await db.collection("works").findOne({ _id: o.workId });
    console.log(`  Job     : "${work?.title || "?"}"`);
    console.log(`  Client  : ${client?.fullName || client?.rollNumber || "?"}`);
    console.log(`  Worker  : ${worker?.fullName || worker?.rollNumber || "?"}`);
    console.log(`  Status  : ${o.status} | Payment: ${o.paymentStatus || "unpaid"} | Method: ${o.paymentMethod || "-"}`);
    console.log(`  PaidAt  : ${o.paidAt || "not paid"}`);
    console.log(`  _id     : ${o._id}`);
    console.log();
  }

  // ── Applications ───────────────────────────────────────────────────────────
  const apps = await db.collection("applications").find({}).toArray();
  console.log(`\nAPPLICATIONS (${apps.length}):`); sep();
  for (const a of apps) {
    const applicant = await db.collection("users").findOne({ _id: a.applicantId });
    const work = await db.collection("works").findOne({ _id: a.workId });
    console.log(`  [${a.status}] ${applicant?.fullName || applicant?.rollNumber || "?"} -> "${work?.title || "?"}"`);
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  const msgs = await db.collection("messages").find({}).toArray();
  console.log(`\nMESSAGES (${msgs.length}):`); sep();
  for (const m of msgs) {
    const sender = m.senderId ? await db.collection("users").findOne({ _id: m.senderId }) : null;
    const name = sender ? (sender.fullName || sender.rollNumber) : "SYSTEM";
    console.log(`  [${m.messageType || "text"}] ${name}: ${m.message.substring(0, 60)}`);
    console.log(`         seenBy: ${m.seenBy?.length || 0} user(s)`);
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  const notifs = await db.collection("notifications").find({}).toArray();
  console.log(`\nNOTIFICATIONS (${notifs.length}):`); sep();
  for (const n of notifs) {
    const user = await db.collection("users").findOne({ _id: n.userId });
    console.log(`  To: ${user?.fullName || user?.rollNumber || "?"} | Type: ${n.type} | Read: ${n.read}`);
    console.log(`  "${n.message.substring(0, 70)}"`);
    console.log(`  refId: ${n.refId || "-"} (${n.refType || "-"})`);
    console.log();
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\nSUMMARY:"); sep();
  console.log(`  Users         : ${await db.collection("users").countDocuments()}`);
  console.log(`  Works         : ${works.length}`);
  console.log(`  Orders        : ${orders.length}`);
  console.log(`  Applications  : ${apps.length}`);
  console.log(`  Chats         : ${await db.collection("chats").countDocuments()}`);
  console.log(`  Messages      : ${msgs.length}`);
  console.log(`  Notifications : ${notifs.length}`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
