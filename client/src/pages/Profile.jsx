import { auth } from "../firebase";
import { useTheme } from "../context/ThemeContext";

export default function Profile() {
  const { darkMode } = useTheme();

  const user = auth.currentUser;

  return (
    <div className={`min-h-screen px-6 py-10 ${
      darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
    }`}>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
        <div className={`p-6 rounded-2xl shadow ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <h1 className="text-2xl font-bold">👤 Profile</h1>
          <p className="text-sm opacity-70 mt-1">
            Account information
          </p>
        </div>

        {/* INFO */}
        <div className={`p-6 rounded-2xl shadow space-y-4 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>

          <div>
            <p className="text-sm opacity-70">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>

          <div>
            <p className="text-sm opacity-70">User ID</p>
            <p className="font-mono text-xs">{user?.uid}</p>
          </div>

        </div>

        {/* MY TICKETS */}
        <div className={`p-6 rounded-2xl shadow ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>

          <h2 className="font-semibold mb-3">🧾 My Tickets</h2>

          <button
            onClick={() => window.location.href = "/tickets"}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
          >
            View My Tickets
          </button>

        </div>

        {/* SESSION */}
        <div className={`p-6 rounded-2xl shadow ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>

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