import { useState } from "react";
import {
  X,
  Bell,
  Ticket,
  Trash2,
  CheckCheck,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const PRIORITY_META = {
  low: "bg-gray-500/10 text-gray-500",
  medium: "bg-amber-500/10 text-amber-500",
  high: "bg-red-500/10 text-red-500",
};

function formatTime(createdAt) {
  if (!createdAt?.toDate) return "Just now";
  return createdAt.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationCard({
  notification,
  darkMode,
  isAdmin,
  users,
  busyId,
  onAssign,
  onStatusChange,
  onMarkRead,
  onDelete,
}) {
  const [assignee, setAssignee] = useState("");
  const n = notification;
  const isBusy = busyId === n.id;

  // Only "a new ticket needs review" notifications get the action row.
  // ticket_assigned / ticket_status notifications are one-way updates,
  // not things left to action.
  const canAct = isAdmin && n.ticketId && n.type === "ticket_created";

  return (
    <div
      className={`relative rounded-2xl border p-4 transition ${
        darkMode
          ? n.read
            ? "border-gray-800 bg-gray-900"
            : "border-indigo-500/30 bg-indigo-500/5"
          : n.read
          ? "border-gray-200 bg-white"
          : "border-indigo-200 bg-indigo-50"
      }`}
    >
      {!n.read && (
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-indigo-500" />
      )}

      <div className="flex items-start gap-3 pr-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            darkMode ? "bg-gray-800 text-indigo-400" : "bg-indigo-100 text-indigo-600"
          }`}
        >
          <Ticket size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-snug ${darkMode ? "text-white" : "text-gray-800"}`}>
            {n.message}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className={darkMode ? "text-gray-500" : "text-gray-400"}>{formatTime(n.createdAt)}</span>

            {n.priority && (
              <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${PRIORITY_META[n.priority] || PRIORITY_META.low}`}>
                {n.priority}
              </span>
            )}

            {n.requesterEmail && (
              <span className={darkMode ? "text-gray-500" : "text-gray-400"}>from {n.requesterEmail}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!n.read && (
            <button
              onClick={() => onMarkRead(n.id)}
              title="Mark as read"
              className={`rounded-full p-1.5 transition ${
                darkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              <CheckCheck size={15} />
            </button>
          )}
          <button
            onClick={() => onDelete(n.id)}
            title="Delete"
            className={`rounded-full p-1.5 transition ${
              darkMode ? "text-gray-500 hover:bg-gray-800 hover:text-red-400" : "text-gray-400 hover:bg-gray-100 hover:text-red-500"
            }`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {canAct && (
        <div className={`mt-3 space-y-2 border-t pt-3 ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          {users?.length > 0 && (
            <div className="flex gap-2">
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={isBusy}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                  darkMode ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <option value="">Assign to…</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
              <button
                disabled={!assignee || isBusy}
                onClick={() => {
                  onAssign(n, users.find((u) => u.uid === assignee));
                  setAssignee("");
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UserPlus size={13} />
                Assign
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={isBusy}
              onClick={() => onStatusChange(n, "in_progress")}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1.5 text-xs font-medium text-blue-500 transition hover:bg-blue-500/20 disabled:opacity-40"
            >
              <Clock size={13} />
              In Progress
            </button>
            <button
              disabled={isBusy}
              onClick={() => onStatusChange(n, "approved")}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-500/10 px-2 py-1.5 text-xs font-medium text-green-500 transition hover:bg-green-500/20 disabled:opacity-40"
            >
              <CheckCircle2 size={13} />
              Approve
            </button>
            <button
              disabled={isBusy}
              onClick={() => onStatusChange(n, "declined")}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/20 disabled:opacity-40"
            >
              <XCircle size={13} />
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Slide-over notification drawer. Purely presentational — all Firestore
 * calls happen in the parent (Dashboard) and are passed in as callbacks,
 * so this component stays easy to reuse and test.
 */
export default function NotificationSidebar({
  isOpen,
  onClose,
  notifications = [],
  isAdmin = false,
  users = [],
  darkMode,
  busyId = null,
  onAssign = () => {},
  onStatusChange = () => {},
  onMarkRead = () => {},
  onMarkAllRead = () => {},
  onDelete = () => {},
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white">
                {unreadCount} new
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}`}
          >
            <X size={18} />
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="mx-5 mt-3 self-start text-xs font-medium text-indigo-500 hover:underline"
          >
            Mark all as read
          </button>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {notifications.length === 0 ? (
            <div className={`mt-16 text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              <Bell size={28} className="mx-auto mb-3 opacity-40" />
              You're all caught up.
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                darkMode={darkMode}
                isAdmin={isAdmin}
                users={users}
                busyId={busyId}
                onAssign={onAssign}
                onStatusChange={onStatusChange}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}