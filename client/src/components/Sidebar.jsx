import { Link, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Ticket,
  Users,
  User,
  Settings
} from "lucide-react"

import { auth } from "../firebase"
import { getUserRole } from "../services/userService"

export default function Sidebar() {
  const location = useLocation()
  const [role, setRole] = useState(null)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const r = await getUserRole(user.uid)
        setRole(r)
      }
    })

    return () => unsub()
  }, [])

  const menus = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Tickets", icon: <Ticket size={20} />, path: "/tickets" },

    // 🔥 ADMIN ONLY
    ...(role === "admin"
      ? [{ name: "Users", icon: <Users size={20} />, path: "/users" }]
      : []),

    { name: "Profile", icon: <User size={20} />, path: "/profile" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" }
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-2xl">
      <div className="p-6 text-xl font-bold border-b border-slate-700">
        🎫 TicketSys
      </div>

      <nav className="mt-4 px-3 space-y-1">
        {menus.map((menu) => {
          const active = location.pathname === menu.path

          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition
              ${
                active
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {menu.icon}
              <span className="text-sm font-medium">{menu.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}