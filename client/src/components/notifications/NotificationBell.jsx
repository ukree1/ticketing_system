import { Bell } from "lucide-react";

/**
 * Icon button for the dashboard header. Shows an unread badge and opens
 * the NotificationSidebar when clicked.
 */
export default function NotificationBell({ unreadCount = 0, onClick, darkMode }) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
        darkMode
          ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
          : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
      }`}
    >
      <Bell size={20} className={hasUnread ? "animate-[wiggle_1.2s_ease-in-out_1]" : ""} />

      {hasUnread && (
        <span
          className={`absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ${
            darkMode ? "ring-gray-900" : "ring-white"
          }`}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-12deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-6deg); }
          80% { transform: rotate(4deg); }
        }
      `}</style>
    </button>
  );
}