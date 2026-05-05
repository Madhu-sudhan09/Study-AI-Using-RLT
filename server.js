require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const morgan   = require("morgan");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(morgan("dev"));

app.use("/api/auth",      require("./routes/auth"));
app.use("/api/students",  require("./routes/students"));
app.use("/api/subjects",  require("./routes/subjects"));
app.use("/api/plans",     require("./routes/plans"));
app.use("/api/tasks",     require("./routes/tasks"));
app.use("/api/ml",        require("./routes/ml"));
app.use("/api/rl",        require("./routes/rl"));
app.use("/api/llm",       require("./routes/llm"));
app.use("/api/chat",      require("./routes/chat"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/pdf",       require("./routes/pdf"));
app.use("/api/rewards",   require("./routes/rewards"));   // ← NEW

app.get("/api/health", (req, res) => {
  res.json({
    status:    "OK", message: "StudyAI API running", timestamp: new Date().toISOString(),
    mongodb:   mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    llm:       process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-your-key-here" ? "configured" : "not configured"
  });
});

app.use((req, res) => res.status(404).json({ success:false, message:"Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success:false, message: err.message });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 StudyAI running on http://localhost:${PORT}`);
      console.log(`🎮 Reward & Penalty System: ACTIVE`);
      console.log(`🤖 LLM: ${process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-your-key-here" ? "✅ Configured" : "⚠️  Add ANTHROPIC_API_KEY to .env"}`);
    });
  })
  .catch(err => { console.error("❌ MongoDB failed:", err.message); process.exit(1); });
require('./models/RewardLog');
