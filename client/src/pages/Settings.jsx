import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen px-6 py-10 transition ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div
          className={`rounded-2xl p-6 shadow ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h1 className="text-2xl font-bold">⚙ Settings</h1>
          <p className="text-sm opacity-70 mt-1">
            Account & session management
          </p>
        </div>

        {/* LOGOUT ONLY */}
        <div
          className={`rounded-2xl p-6 shadow ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="font-semibold mb-3">🚪 Session</h2>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}