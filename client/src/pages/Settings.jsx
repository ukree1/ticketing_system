import { useNavigate } from "react-router-dom";
import { LogOut, ArrowLeft } from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { logoutUser } from "../auth/authService";

export default function Settings() {
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout Error:", err);
      alert("Failed to logout.");
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        darkMode
          ? "bg-gray-950 text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* HEADER (Refined UX Layout) */}
        <div
          className={`rounded-2xl border shadow-sm transition-all p-6 ${
            darkMode
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">

            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToDashboard}
                className={`p-2 rounded-xl transition-all active:scale-95 ${
                  darkMode
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-200"
                }`}
              >
                <ArrowLeft size={20} />
              </button>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Settings
                </h1>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Manage your account and preferences
                </p>
              </div>
            </div>

            {/* Right: Theme Toggle (more polished UX control) */}
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Theme
              </span>

              <button
                onClick={handleToggleDarkMode}
                className={`relative w-14 h-7 flex items-center rounded-full transition-all duration-300 ${
                  darkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute h-5 w-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                    darkMode ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SESSION CARD (Upgraded hierarchy + clarity) */}
        <div
          className={`rounded-2xl border shadow-sm p-6 transition-all ${
            darkMode
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Session</h2>
            <p
              className={`text-sm mt-1 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Manage your login session and security access.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] bg-red-600 hover:bg-red-700 text-white shadow-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}