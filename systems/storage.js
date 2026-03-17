const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "../data/users.json");

// Ensure file exists
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "{}");

function read() {
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("⚠️ Failed to read JSON, resetting file:", err);
    fs.writeFileSync(dataFile, "{}");
    return {};
  }
}

function write(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to write JSON:", err);
  }
}

module.exports = { read, write };