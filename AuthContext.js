// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, studentAPI } from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("studyai_token");
    if (token) {
      studentAPI.getProfile()
        .then(res => setStudent(res.data.student))
        .catch(() => { localStorage.removeItem("studyai_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem("studyai_token", res.data.token);
    setStudent(res.data.student);
    return res.data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem("studyai_token", res.data.token);
    setStudent(res.data.student);
    return res.data;
  };

  const guestLogin = async (name = "Guest Student") => {
    const res = await authAPI.guest({ name });
    localStorage.setItem("studyai_token", res.data.token);
    setStudent(res.data.student);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("studyai_token");
    setStudent(null);
  };

  const refreshStudent = async () => {
    const res = await studentAPI.getProfile();
    setStudent(res.data.student);
    return res.data.student;
  };

  return (
    <AuthContext.Provider value={{ student, setStudent, loading, login, register, guestLogin, logout, refreshStudent }}>
      {children}
    </AuthContext.Provider>
  );
}
