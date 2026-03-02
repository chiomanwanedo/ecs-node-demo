const express = require("express");
const os = require("os");

const app = express();
const PORT = 8080;

app.get("/", (req, res) => {
  res.send("🚀 ECS Demo App is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/info", (req, res) => {
  res.json({
    hostname: os.hostname(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});