import { MessageCircle } from "lucide-react";

export default function MessageBell({ unreadCount = 0, darkMode, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open messages"
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
        darkMode ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-50"
      } ring-1 ${darkMode ? "ring-gray-700" : "ring-gray-200"}`}
    >
      <MessageCircle size={18} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}