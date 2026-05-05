// models/RewardLog.js — tracks every reward and penalty event
const mongoose = require("mongoose");

const RewardLogSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  type:        { type: String, enum: ["reward","penalty","reminder"], required: true },
  reason:      { type: String, required: true },
  rlDelta:     { type: Number, default: 0 },   // +10, -5 etc.
  xpDelta:     { type: Number, default: 0 },
  subject:     { type: String, default: "" },
  oldMarks:    { type: Number },               // for mark improvement tracking
  newMarks:    { type: Number },
  improvement: { type: Number },               // newMarks - oldMarks
  taskId:      { type: mongoose.Schema.Types.ObjectId, ref: "Task" }
}, { timestamps: true });

module.exports = mongoose.model("RewardLog", RewardLogSchema);
