import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, User } from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { logoutUser } from "../auth/authService";
import { auth } from "../firebase";

export default function Settings() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout Error:", err);
      alert("Failed to logout.");
    } finally {
      setLoggingOut(false);
    }
  };

  const cardClass = `rounded-2xl border shadow-sm transition-all ${
    darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
  }`;

  const subtleText = darkMode ? "text-gray-400" : "text-gray-500";

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ACCOUNT CARD */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                darkMode
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "bg-indigo-100 text-indigo-600"
              }`}
            >
              <User size={20} />
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold">
                {auth.currentUser?.email}
              </p>
              <p className={`text-sm ${subtleText}`}>
                Signed in account
              </p>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS CARD */}
        <div className={`${cardClass} p-6 space-y-5`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                darkMode
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "bg-indigo-100 text-indigo-600"
              }`}
            >
              <Bell size={18} />
            </div>

            <div>
              <p className="font-semibold">Notifications</p>
              <p className={`text-sm ${subtleText}`}>
                Choose how you want to be notified.
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-1">

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  Email notifications
                </p>
                <p className={`text-xs ${subtleText}`}>
                  Ticket updates sent to your inbox.
                </p>
              </div>

              <button
                onClick={() => setEmailNotifs((v) => !v)}
                aria-label="Toggle email notifications"
                className={`relative w-12 h-6 flex items-center rounded-full transition-all duration-300 ${
                  emailNotifs
                    ? "bg-blue-600"
                    : darkMode
                    ? "bg-gray-700"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute h-4 w-4 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                    emailNotifs
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  Push notifications
                </p>
                <p className={`text-xs ${subtleText}`}>
                  Real-time alerts in the app.
                </p>
              </div>

              <button
                onClick={() => setPushNotifs((v) => !v)}
                aria-label="Toggle push notifications"
                className={`relative w-12 h-6 flex items-center rounded-full transition-all duration-300 ${
                  pushNotifs
                    ? "bg-blue-600"
                    : darkMode
                    ? "bg-gray-700"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute h-4 w-4 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                    pushNotifs
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

          </div>
        </div>

        {/* SESSION CARD */}
        <div className={`${cardClass} p-6`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Session</h2>
            <p className={`text-sm mt-1 ${subtleText}`}>
              Manage your login session and security access.
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogOut size={18} />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>

      </div>
    </MainLayout>
  );
}