import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";
import {
  listenNotifications,
  markNotificationAsRead,
} from "../services/notificationService";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const role = useRole();
  const { darkMode } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let unsubscribeNotifications = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      if (!user || role === "admin") {
        setNotifications([]);
        return;
      }

      unsubscribeNotifications = listenNotifications(user.uid, setNotifications);
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [role]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleRead = async (id) => {
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 shadow-sm sm:px-6 lg:px-8 ${
        darkMode
          ? "border-gray-800 bg-gray-950 text-white"
          : "border-gray-200 bg-white text-gray-900"
      }`}
    >
      <h1 className="truncate text-base font-semibold sm:text-lg">
        Ticketing System
      </h1>

      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        {role !== "admin" && (
          <div className="relative">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className={`relative rounded-full p-2 transition ${
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
            >
              <Bell size={20} />

              {unread > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                  {unread}
                </span>
              )}
            </button>

            {open && (
              <div
                className={`absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-lg border shadow-lg sm:w-80 ${
                  darkMode
                    ? "border-gray-800 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-900"
                }`}
              >
                <div
                  className={`border-b p-3 font-semibold ${
                    darkMode ? "border-gray-800" : "border-gray-200"
                  }`}
                >
                  Notifications
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="p-3 text-sm opacity-60">
                      No notifications yet
                    </p>
                  )}

                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`border-b p-3 transition ${
                        darkMode
                          ? "border-gray-800 hover:bg-gray-800"
                          : "border-gray-200 hover:bg-gray-50"
                      } ${n.read ? "opacity-60" : ""}`}
                    >
                      <p className="text-sm">{n.message}</p>

                      <p className="mt-1 text-xs opacity-50">
                        {n.createdAt?.toDate
                          ? n.createdAt.toDate().toLocaleString()
                          : "Just now"}
                      </p>

                      {!n.read && (
                        <button
                          onClick={() => handleRead(n.id)}
                          className="mt-2 text-xs font-medium text-indigo-500"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
            {auth.currentUser?.email?.charAt(0).toUpperCase()}
          </div>

          <span className="hidden max-w-[180px] truncate text-sm opacity-75 sm:block">
            {auth.currentUser?.email}
          </span>
        </div>
      </div>
    </header>
  );
}