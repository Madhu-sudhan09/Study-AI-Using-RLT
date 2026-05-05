// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem("studyai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("studyai_token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: d => API.post("/auth/register", d),
  login:    d => API.post("/auth/login",    d),
  guest:    d => API.post("/auth/guest",     d)
};

export const studentAPI = {
  getProfile:     ()  => API.get("/students/profile"),
  updateProfile:  d   => API.put("/students/profile",  d),
  updateSubjects: d   => API.put("/students/subjects",  d)
};

export const planAPI = {
  generate:  () => API.post("/plans/generate"),
  getActive: () => API.get("/plans/active"),
  getAll:    () => API.get("/plans")
};

export const taskAPI = {
  getAll:     ()      => API.get("/tasks"),
  bulkCreate: tasks   => API.post("/tasks/bulk", { tasks }),
  toggle:     id      => API.patch(`/tasks/${id}/toggle`),
  remove:     id      => API.delete(`/tasks/${id}`)
};

export const mlAPI = {
  train:     () => API.post("/ml/train"),
  getResult: () => API.get("/ml/result")
};

export const rlAPI = {
  run:       () => API.post("/rl/run"),
  getResult: () => API.get("/rl/result")
};

export const llmAPI = {
  generateStudyPlan: () => API.post("/llm/study-plan"),
  explainML:         () => API.post("/llm/explain-ml")
};

export const chatAPI = {
  send:         (message, sessionId) => API.post("/chat/send",    { message, sessionId }),
  getHistory:   sessionId            => API.get("/chat/history",  { params: { sessionId } }),
  clearHistory: ()                   => API.delete("/chat/history")
};

export const analyticsAPI = {
  getDashboard: () => API.get("/analytics/dashboard")
};

// PDF API — uses multipart form for upload
export const pdfAPI = {
  upload: (file) => {
    const form = new FormData();
    form.append("syllabus", file);
    return API.post("/pdf/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000
    });
  },
  analyze: () => API.post("/pdf/analyze"),
  getInfo: () => API.get("/pdf/info"),
  remove:  () => API.delete("/pdf/remove")
};

export default API;

// ── Rewards & Penalties ──────────────────────────────────────
export const rewardAPI = {
  taskToggle:    (taskId)   => API.post("/rewards/task-toggle",   { taskId }),
  updateMarks:   (subjects) => API.post("/rewards/update-marks",  { subjects }),
  getSummary:    ()         => API.get("/rewards/summary"),
  getReminders:  ()         => API.get("/rewards/reminders"),
  setReminders:  ()         => API.post("/rewards/reminders"),
  markReminderDone: (idx)   => API.patch(`/rewards/reminders/${idx}/done`),
  dailyCheck:    ()         => API.post("/rewards/daily-check")
};
