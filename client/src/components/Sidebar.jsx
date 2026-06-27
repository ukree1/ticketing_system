import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  Users,
  User,
  Settings
} from "lucide-react";

import { auth } from "../firebase";
import { getUserRole } from "../services/userService";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar() {
  const location = useLocation();
  const { darkMode } = useTheme();

  const [role, setRole] = useState("user");
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setRole("user");
        setLoadingRole(false);
        return;
      }

      try {
        const r = await getUserRole(user.uid);
        setRole(r);
      } catch (err) {
        console.error(err);
        setRole("user");
      } finally {
        setLoadingRole(false);
      }
    });

    return () => unsub();
  }, []);

  const menus = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard"
    },
    {
      name: "Tickets",
      icon: <Ticket size={20} />,
      path: "/tickets"
    },

    ...(role === "admin"
      ? [
          {
            name: "Users",
            icon: <Users size={20} />,
            path: "/users"
          }
        ]
      : []),

    {
      name: "Profile",
      icon: <User size={20} />,
      path: "/profile"
    },
    {
      name: "Settings",
      icon: <Settings size={20} />,
      path: "/settings"
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 shadow-2xl border-r transition
      ${
        darkMode
          ? "bg-gray-900 text-white border-gray-800"
          : "bg-white text-gray-900 border-gray-200"
      }`}
    >
      {/* HEADER */}
      <div className="p-6 text-xl font-bold border-b border-opacity-20">
        🎫 TicketSys
      </div>

      {/* ROLE DISPLAY */}
      <div
        className={`px-6 py-3 text-xs border-b ${
          darkMode
            ? "text-gray-400 border-gray-800"
            : "text-gray-500 border-gray-200"
        }`}
      >
        Role: {loadingRole ? "Loading..." : role.toUpperCase()}
      </div>

      {/* MENU */}
      <nav className="mt-4 px-3 space-y-1">
        {menus.map((menu) => {
          const active = location.pathname === menu.path;

          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${
                active
                  ? darkMode
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-500 text-white shadow-md"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {menu.icon}
              <span className="text-sm font-medium">{menu.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}