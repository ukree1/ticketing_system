import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";
import { listenDashboardStats } from "../services/dashboardService";
import { useTheme } from "../context/ThemeContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const role = useRole();
  const { darkMode, toggleDarkMode } = useTheme();

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0
  });

  useEffect(() => {
    const unsub = listenDashboardStats(setStats);
    return () => unsub();
  }, []);

  return (
    <MainLayout>
      {/* MAIN WRAPPER */}
      <div
        className={`min-h-screen w-full transition-all duration-300 ${
          darkMode ? "bg-black text-white" : "bg-gray-100 text-gray-900"
        }`}
      >

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 px-6 pt-6">

          {/* LEFT INFO */}
          <div>
            <h1 className="text-3xl font-bold text-indigo-500">
              Dashboard
            </h1>

            <p className="text-sm opacity-70 mt-1">
              Welcome, {auth.currentUser?.email}
            </p>

            <p className="text-xs text-indigo-400 mt-1">
              Role: {role || "Loading..."}
            </p>
          </div>

          {/* DARK MODE TOGGLE */}
          <button
            onClick={toggleDarkMode}
            className={`px-5 py-2 rounded-xl font-medium transition ${
              darkMode
                ? "bg-yellow-400 text-black"
                : "bg-indigo-600 text-white"
            }`}
          >
            {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-6">
          <DashboardCard title="Total Tickets" value={stats.total} color="bg-blue-500" />
          <DashboardCard title="Open Tickets" value={stats.open} color="bg-green-500" />
          <DashboardCard title="In Progress" value={stats.inProgress} color="bg-yellow-500" />
          <DashboardCard title="Closed Tickets" value={stats.closed} color="bg-red-500" />
        </div>

        {/* QUICK ACTIONS */}
        <div
          className={`mx-6 mt-8 p-6 rounded-2xl transition ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
          <h2 className="text-xl font-semibold mb-4">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/tickets")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
            >
              View Tickets
            </button>

            {role === "admin" && (
              <button
                onClick={() => navigate("/users")}
                className="bg-gray-800 hover:bg-black text-white px-5 py-2 rounded-lg"
              >
                Manage Users
              </button>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}