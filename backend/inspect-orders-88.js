require("dotenv").config();
const connect = require("./config/db");
const User = require("./models/User");
const Work = require("./models/Work");
const Order = require("./models/Order");

async function run() {
  await connect();
  const user = await User.findOne({ rollNumber: "88" });
  console.log("user", user && user._id, user && user.rollNumber);
  if (!user) {
    console.log("No user with rollNumber 88");
    process.exit(0);
  }

  const orders = await Order.find({
    $or: [{ clientId: user._id }, { workerId: user._id }],
  }).populate("workId");
  console.log(
    "real orders",
    orders.map((o) => ({
      id: o._id.toString(),
      status: o.status,
      work: o.workId && o.workId.title,
    }))
  );

  const allWorks = await Work.find();
  const appliedWorks = allWorks.filter((w) =>
    (w.applications || []).some(
      (a) => a.userId && a.userId.toString() === user._id.toString()
    )
  );
  console.log(
    "appliedWorks",
    appliedWorks.map((w) => ({
      id: w._id.toString(),
      title: w.title,
      apps: (w.applications || []).map((a) => a.userId.toString()),
    }))
  );

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

