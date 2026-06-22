import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { logoutUser } from "../auth/authService"
import useRole from "../hooks/useRole"
import MainLayout from "../layouts/MainLayout"
import DashboardCard from "../components/DashboardCard"
import { listenDashboardStats } from "../services/dashboardService"

export default function Dashboard() {
  const navigate = useNavigate()
  const role = useRole()

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0
  })

  useEffect(() => {
    const unsub = listenDashboardStats(setStats)
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    navigate("/")
  }

  return (
    <MainLayout>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Dashboard
          </h1>

          <p className="text-slate-500 mt-1">
            Welcome, {auth.currentUser?.email}
          </p>

          <p className="text-sm text-indigo-600 font-medium mt-1">
            Role: {role || "Loading..."}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Tickets" value={stats.total} color="bg-blue-500" />
        <DashboardCard title="Open Tickets" value={stats.open} color="bg-blue-500" />
        <DashboardCard title="In Progress" value={stats.inProgress} color="bg-blue-500" />
        <DashboardCard title="Closed Tickets" value={stats.closed} color="bg-blue-500" />
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">
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
              className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg"
            >
              Manage Users
            </button>
          )}
        </div>
      </div>

      {/* ADMIN BANNER */}
      {role === "admin" && (
        <div className="mt-8 bg-yellow-100 border border-yellow-300 p-5 rounded-2xl">
          <h3 className="font-bold text-yellow-800">
            Administrator Access
          </h3>
          <p className="text-yellow-700 mt-2">
            You can manage all tickets, users, and system settings.
          </p>
        </div>
      )}
    </MainLayout>
  )
}