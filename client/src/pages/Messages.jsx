import MainLayout from "../layouts/MainLayout";
import MessageFeed from "../components/messages/MessageFeed";
import useRole from "../hooks/useRole";
import useBroadcasts from "../hooks/useBroadcasts";
import { useTheme } from "../context/ThemeContext";

export default function Messages() {
  const role = useRole();
  const isAdmin = role === "admin";
  const { darkMode } = useTheme();
  const { messages, loading } = useBroadcasts(isAdmin);

  return (
    <MainLayout>
      <div
        className={`min-h-screen w-full transition-all duration-300 ${
          darkMode ? "bg-black text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="mx-auto flex h-screen w-full max-w-3xl flex-col px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:pb-8">
          <h1 className="mb-4 text-2xl font-bold text-indigo-500 sm:mb-6 sm:text-3xl">Messages</h1>

          <div
            className={`min-h-0 flex-1 overflow-hidden rounded-2xl shadow-sm ring-1 ${
              darkMode ? "bg-gray-900 ring-gray-800" : "bg-white ring-gray-100"
            }`}
          >
            <MessageFeed messages={messages} loading={loading} isAdmin={isAdmin} darkMode={darkMode} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}