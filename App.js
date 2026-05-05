// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage   from "./pages/LoginPage";
import Dashboard   from "./pages/Dashboard";

function PrivateRoute({ children }) {
  const { student, loading } = useAuth();
  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:16 }}>
      <div className="spinner" style={{width:32,height:32,borderWidth:3}}></div>
      <p style={{color:"var(--text2)"}}>Loading StudyAI...</p>
    </div>
  );
  return student ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard/*" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
