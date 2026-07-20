import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bell,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Ticket,
  User,
  Users,
} from "lucide-react";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";
import { listenNotifications } from "../services/notificationService";
import { listenBroadcasts } from "../services/broadcastService";
import { getUserProfile } from "../services/userService";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar() {
  const location = useLocation();
  const { darkMode } = useTheme();

  // Role now comes from the shared RoleProvider (see
  // src/context/RoleContext.jsx) instead of Sidebar running its own
  // onAuthStateChanged + getUserRole() — that duplication was firing a
  // second, independent role fetch every time auth state changed.
  const role = useRole();

  const [notifications, setNotifications] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [lastSeenBroadcastAt, setLastSeenBroadcastAt] = useState(null);

  useEffect(() => {
    let unsubscribeNotifications = () => {};
    let unsubscribeBroadcasts = () => {};
    let cancelled = false;

    const user = auth.currentUser;

    // Wait until we have both a signed-in user and a resolved role
    // before deciding which listeners to set up.
    if (!user || role === null) {
      setNotifications([]);
      setBroadcasts([]);
      return () => {};
    }

    (async () => {
      if (role !== "admin") {
        unsubscribeNotifications = listenNotifications(user.uid, setNotifications);

        const profile = await getUserProfile(user.uid).catch(() => null);
        if (!cancelled) {
          setLastSeenBroadcastAt(profile?.lastSeenBroadcastAt || null);
        }
      } else {
        setNotifications([]);
      }

      // One announcement channel, visible to everyone — used here just
      // to badge unread announcements for regular users.
      unsubscribeBroadcasts = listenBroadcasts(setBroadcasts, () => setBroadcasts([]));
    })();

    return () => {
      cancelled = true;
      unsubscribeNotifications();
      unsubscribeBroadcasts();
    };
  }, [role]);

  const toMillis = (ts) => ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadMessages =
    role === "admin"
      ? 0
      : broadcasts.filter((m) => toMillis(m.createdAt) > toMillis(lastSeenBroadcastAt)).length;

  const menus = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    {
      name: "Tickets",
      icon: <Ticket size={20} />,
      path: "/tickets",
    },
    {
      name: "Messages",
      icon: (
        <div className="relative">
          <MessageCircle size={20} />

          {unreadMessages > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
              {unreadMessages}
            </span>
          )}
        </div>
      ),
      path: "/messages",
    },
    ...(role === "admin"
      ? [
          {
            name: "Users",
            icon: <Users size={20} />,
            path: "/users",
          },
        ]
      : []),
    ...(role !== "admin"
      ? [
          {
            name: "Notifications",
            icon: (
              <div className="relative">
                <Bell size={20} />

                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            ),
            path: "/notifications",
          },
        ]
      : []),
    {
      name: "Profile",
      icon: <User size={20} />,
      path: "/profile",
    },
    {
      name: "Settings",
      icon: <Settings size={20} />,
      path: "/settings",
    },
  ];

  const getLinkClass = (active, mobile = false) => {
    const base = mobile
      ? "flex min-w-16 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs transition"
      : "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200";

    if (active) {
      return `${base} ${
        darkMode ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white"
      }`;
    }

    return `${base} ${
      darkMode
        ? "text-gray-300 hover:bg-gray-800"
        : "text-gray-600 hover:bg-gray-100"
    }`;
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen w-64 border-r shadow-2xl transition lg:block ${
          darkMode
            ? "border-gray-800 bg-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-900"
        }`}
      >
        <div
          className={`border-b p-6 text-xl font-bold ${
            darkMode ? "border-gray-800" : "border-gray-200"
          }`}
        >
          TicketSys
        </div>

        <div
          className={`border-b px-6 py-3 text-xs ${
            darkMode
              ? "border-gray-800 text-gray-400"
              : "border-gray-200 text-gray-500"
          }`}
        >
          Role: {role === null ? "Loading..." : role.toUpperCase()}
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {menus.map((menu) => {
            const active = location.pathname === menu.path;

            return (
              <Link key={menu.path} to={menu.path} className={getLinkClass(active)}>
                {menu.icon}
                <span className="text-sm font-medium">{menu.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t px-2 py-2 shadow-2xl lg:hidden ${
          darkMode
            ? "border-gray-800 bg-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-around gap-1 overflow-x-auto">
          {menus.map((menu) => {
            const active = location.pathname === menu.path;

            return (
              <Link
                key={menu.path}
                to={menu.path}
                className={getLinkClass(active, true)}
              >
                {menu.icon}
                <span className="max-w-16 truncate">{menu.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}