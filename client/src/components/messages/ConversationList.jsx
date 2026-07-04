import { MessageCircle } from "lucide-react";

const initials = (text = "") =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const formatTime = (ts) => {
  if (!ts?.toDate) return "";

  const date = ts.toDate();
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const STATUS_STYLES = {
  pending: "bg-amber-500",
  "in progress": "bg-blue-500",
  approved: "bg-green-500",
  declined: "bg-red-500",
};

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isAdmin,
  darkMode,
  loading,
}) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm opacity-60">Loading conversations…</p>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center opacity-60">
        <MessageCircle size={28} />
        <p className="text-sm">
          {isAdmin ? "No tickets to message yet." : "No conversations yet."}
        </p>
      </div>
    );
  }

  return (
    <ul className={`h-full divide-y overflow-y-auto ${darkMode ? "divide-gray-800" : "divide-gray-100"}`}>
      {conversations.map((c) => {
        const displayName = isAdmin
          ? c.createdByName || c.createdByEmail || "Requester"
          : "Admin Support";

        const preview = c.lastMessageText || "No messages yet";
        const active = c.id === selectedId;
        const statusDot = STATUS_STYLES[(c.status || "").toLowerCase()] || "bg-gray-400";

        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                active
                  ? darkMode
                    ? "bg-indigo-500/10"
                    : "bg-indigo-50"
                  : darkMode
                    ? "hover:bg-gray-800/60"
                    : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  darkMode ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {initials(displayName)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{displayName}</span>
                  <span className="shrink-0 text-[11px] opacity-50">
                    {formatTime(c.lastMessageAt || c.createdAt)}
                  </span>
                </span>

                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} />
                  <span className="truncate text-xs opacity-70">{c.title || "Untitled ticket"}</span>
                </span>

                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs opacity-60">{preview}</span>
                  {!isAdmin && c.unreadForUser && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}