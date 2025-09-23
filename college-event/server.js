const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, "data.json");

// Middleware to parse JSON
app.use(express.json());

// Serve frontend from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ---------- Load data from file ----------
let events = [];
let participants = [];

if (fs.existsSync(DATA_FILE)) {
  const rawData = fs.readFileSync(DATA_FILE);
  try {
    const data = JSON.parse(rawData);
    events = data.events || [];
    participants = data.participants || [];
  } catch (err) {
    console.error("Error parsing data.json:", err);
  }
}

// ---------- Helper to save data ----------
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ events, participants }, null, 2));
}

// ---------- API Routes ----------

// Get all events
app.get("/api/events", (req, res) => {
  res.json(events);
});

// Add new event
app.post("/api/events", (req, res) => {
  const { name, image } = req.body;
  if (!name) return res.status(400).json({ error: "Event name is required" });
  if (events.find(ev => ev.name === name))
    return res.status(400).json({ error: "Event already exists" });

  events.push({ name, image: image || "" });
  saveData();
  res.json({ success: true, message: "Event added", events });
});

// Delete event
app.delete("/api/events/:name", (req, res) => {
  const eventName = req.params.name;
  events = events.filter(ev => ev.name !== eventName);
  participants = participants.filter(p => p.event !== eventName);
  saveData();
  res.json({ success: true, message: `Deleted ${eventName}` });
});

// Register participant
app.post("/api/register", (req, res) => {
  const { name, email, event, year, branch, section } = req.body;
  if (!name || !email || !event) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  participants.push({ name, email, event, year, branch, section });
  saveData();
  res.json({ success: true, message: "Registered successfully", participants });
});

// Get participants by event
app.get("/api/participants/:event", (req, res) => {
  const eventName = req.params.event;
  const eventParticipants = participants.filter(p => p.event === eventName);
  res.json(eventParticipants);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
