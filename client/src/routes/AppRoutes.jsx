import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "../pages/Login"
import Register from "../pages/Register"
import Dashboard from "../pages/Dashboard"
import Tickets from "../pages/Tickets"
import Users from "../pages/Users"

import ProtectedRoute from "./ProtectedRoute"

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* USER + ADMIN */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Tickets />
            </ProtectedRoute>
          }
        />

        {/* 🔥 ADMIN ONLY */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}