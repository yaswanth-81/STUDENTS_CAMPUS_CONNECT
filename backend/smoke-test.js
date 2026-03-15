const base = "http://localhost:5000/api";

async function main() {
  const fetchFn = global.fetch;

  // create test user A (client)
  let res = await fetchFn(base + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rollNumber: "CLI" + Date.now(),
      password: "secret123",
    }),
  });
  let data = await res.json();
  console.log("signup client", res.status, data.message);
  const clientToken = data.token;

  // create test user B (worker)
  res = await fetchFn(base + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rollNumber: "WRK" + Date.now(),
      password: "secret123",
    }),
  });
  data = await res.json();
  console.log("signup worker", res.status, data.message);
  const workerToken = data.token;

  // client posts work
  res = await fetchFn(base + "/work", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + clientToken,
    },
    body: JSON.stringify({
      title: "Test dynamic flow",
      description: "flow",
      category: "coding",
      budget: 500,
      deadline: "2026-04-01",
    }),
  });
  data = await res.json();
  console.log("post work", res.status, data.message);
  const workId = data.work && data.work._id;

  // worker applies
  res = await fetchFn(base + "/work/" + workId + "/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + workerToken,
    },
    body: JSON.stringify({ message: "I can do this" }),
  });
  data = await res.json();
  console.log("apply", res.status, data.message);
  const applicationId = data.application && data.application._id;

  // client accepts application
  res = await fetchFn(base + "/application/" + applicationId + "/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + clientToken,
    },
  });
  data = await res.json();
  console.log("accept", res.status, data.message);
  const orderId = data.order && data.order._id;

  // start chat
  res = await fetchFn(base + "/chat/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + workerToken,
    },
    body: JSON.stringify({ orderId }),
  });
  data = await res.json();
  console.log("chat start", res.status, data._id ? "ok" : data.message);

  // send message
  res = await fetchFn(base + "/chat/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + workerToken,
    },
    body: JSON.stringify({ orderId, message: "Hello from worker" }),
  });
  data = await res.json();
  console.log("send msg", res.status, data.message || "ok");

  // notifications for client
  res = await fetchFn(base + "/notifications/my", {
    headers: { Authorization: "Bearer " + clientToken },
  });
  data = await res.json();
  console.log("client notifications", res.status, data.count);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

