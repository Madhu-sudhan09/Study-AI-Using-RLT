// models/Student.js
const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  marks:         { type: Number, required: true, min: 0 },
  total:         { type: Number, default: 100 },
  previousMarks: { type: Number, default: null },  // track improvement
  topics:        [{ type: String }]
});

const StudentSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, unique: true, sparse: true, lowercase: true },
  password:         { type: String },
  studyLevel:       { type: String, enum: ["High School","Undergraduate","Postgraduate","Competitive Exam"], default: "Undergraduate" },
  studyHoursPerDay: { type: Number, default: 6, min: 1, max: 16 },
  examDate:         { type: Date },
  syllabus:         { type: String, default: "" },
  subjects:         [SubjectSchema],

  // PDF Syllabus
  pdfSyllabusText:      { type: String, default: "" },
  pdfSyllabusName:      { type: String, default: "" },
  pdfSyllabusPages:     { type: Number, default: 0 },
  pdfSyllabusWordCount: { type: Number, default: 0 },

  // Reward & Penalty System
  totalXP:          { type: Number, default: 0 },
  totalRLReward:    { type: Number, default: 0 },
  currentStreak:    { type: Number, default: 0 },  // consecutive tasks completed
  longestStreak:    { type: Number, default: 0 },
  level:            { type: Number, default: 1 },
  levelTitle:       { type: String, default: "Beginner" },
  totalPenalties:   { type: Number, default: 0 },
  totalRewards:     { type: Number, default: 0 },
  lastActiveDate:   { type: Date },

  // Reminders
  reminders: [{
    subject:     String,
    message:     String,
    dueDate:     Date,
    completed:   { type: Boolean, default: false },
    createdAt:   { type: Date, default: Date.now }
  }],

  // Analytics
  focusScore:      { type: Number, default: 0 },
  efficiencyScore: { type: Number, default: 0 },
  avgPerformance:  { type: Number, default: 0 }
}, { timestamps: true });

StudentSchema.virtual("weakSubjects").get(function () {
  return this.subjects.filter(s => (s.marks / s.total) * 100 < 60);
});
StudentSchema.virtual("strongSubjects").get(function () {
  return this.subjects.filter(s => (s.marks / s.total) * 100 >= 75);
});

module.exports = mongoose.model("Student", StudentSchema);
