// models/StudyPlan.js
const mongoose = require("mongoose");

const StudyPlanSchema = new mongoose.Schema(
  {
    student:     { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    daysLeft:    { type: Number },
    totalHrsDay: { type: Number },
    subjectAllocations: [
      {
        subjectName: String,
        hoursPerDay: Number,
        priority:    { type: String, enum: ["Critical","Moderate","Maintain"] }
      }
    ],
    llmRecommendation: { type: String, default: "" },
    focusScore:        { type: Number, default: 0 },
    efficiencyScore:   { type: Number, default: 0 },
    active:            { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyPlan", StudyPlanSchema);


// ──────────────────────────────────────────────────────────
const TaskSchema = new mongoose.Schema(
  {
    student:   { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    plan:      { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan" },
    subject:   { type: String, required: true },
    action:    { type: String },
    topic:     { type: String },
    duration:  { type: String },
    completed: { type: Boolean, default: false },
    date:      { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

// ──────────────────────────────────────────────────────────
const MLResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    models: {
      logisticRegression: {
        accuracy:  Number, precision: Number,
        recall:    Number, f1: Number
      },
      decisionTree: {
        accuracy:  Number, precision: Number,
        recall:    Number, f1: Number
      },
      randomForest: {
        accuracy:  Number, precision: Number,
        recall:    Number, f1: Number
      }
    },
    confusionMatrix: {
      classes: [String],
      matrix:  [[Number]]
    },
    subjectClassifications: [
      {
        subjectName: String,
        score:       Number,
        level:       { type: String, enum: ["Low","Medium","High"] }
      }
    ],
    datasetSize: { type: Number, default: 200 }
  },
  { timestamps: true }
);

// ──────────────────────────────────────────────────────────
const RLResultSchema = new mongoose.Schema(
  {
    student:       { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    episodes:      { type: Number, default: 120 },
    totalReward:   { type: Number, default: 0 },
    epsilon:       { type: Number, default: 0 },
    avgQValue:     { type: Number, default: 0 },
    rewardHistory: [Number],
    qTable:        { type: Map, of: [Number] },
    bestAction:    { type: String },
    totalXP:          { type: Number, default: 0 },
    lastRewardDelta:  { type: Number, default: 0 },
    lastXPDelta:      { type: Number, default: 0 },
    nbaSchedule: {
      today:    String,
      tomorrow: String,
      thisWeek: String
    }
  },
  { timestamps: true }
);

// ──────────────────────────────────────────────────────────
const ChatMessageSchema = new mongoose.Schema(
  {
    student:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    role:     { type: String, enum: ["user","assistant"], required: true },
    content:  { type: String, required: true },
    session:  { type: String }
  },
  { timestamps: true }
);

module.exports.StudyPlan   = mongoose.model("StudyPlan",   StudyPlanSchema);
module.exports.Task        = mongoose.model("Task",        TaskSchema);
module.exports.MLResult    = mongoose.model("MLResult",    MLResultSchema);
module.exports.RLResult    = mongoose.model("RLResult",    RLResultSchema);
module.exports.ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
