import { useEffect, useState } from "react";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";
import useNotifications from "../hooks/useNotifications";

import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";
import { reviewTicket, assignTicket } from "../services/ticketService";
import { getUsers } from "../services/userService";

import { Bell, CheckCheck, Clock, CheckCircle2, XCircle, Trash2, UserPlus, Ticket } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const PRIORITY_META = {
  low: "bg-gray-500/10 text-gray-500",
  medium: "bg-amber-500/10 text-amber-500",
  high: "bg-red-500/10 text-red-500",
};

function formatTime(createdAt) {
  if (!createdAt?.toDate) return "Just now";
  return createdAt.toDate().toLocaleString();
}

export default function NotificationsPage() {
  const role = useRole();
  const isAdmin = role === "admin";
  const { darkMode } = useTheme();
  const { notifications } = useNotifications();

  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [selected, setSelected] = useState(null);
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [assignee, setAssignee] = useState({});

  useEffect(() => {
    if (!isAdmin) return;
    getUsers().then((data) => setUsers(data || [])).catch(console.error);
  }, [isAdmin]);

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleView = async (n) => {
    setSelected(n);
    if (!n.read) await markNotificationAsRead(n.id);
  };

  // assignTicket() already notifies the assignee, so nothing extra to send.
  const handleAssign = async (n) => {
    const user = users.find((u) => u.uid === assignee[n.id]);
    if (!user) return;

    setBusyId(n.id);
    try {
      await assignTicket(n.ticketId, user.uid, user.email, user.name || user.email, n.ticketTitle || "");
      await markNotificationAsRead(n.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't assign the ticket. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // reviewTicket() already notifies the ticket's creator, so nothing extra
  // to send here either.
  const handleStatusChange = async (n, status) => {
    setBusyId(n.id);
    try {
      await reviewTicket(
        { id: n.ticketId, title: n.ticketTitle, createdBy: n.requesterUid },
        status
      );
      await markNotificationAsRead(n.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't update the ticket status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Notifications</h1>
          <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex rounded-xl p-1 ${darkMode ? "bg-gray-900" : "bg-gray-200"}`}>
            {["all", "unread"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : darkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead(auth.currentUser?.uid)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:underline"
            >
              <CheckCheck size={15} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className={`mt-20 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            <Bell size={32} className="mx-auto mb-3 opacity-40" />
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </div>
        ) : (
          visible.map((n) => {
            const canAct = isAdmin && n.ticketId && n.type === "ticket_created";
            const isBusy = busyId === n.id;

            return (
              <div
                key={n.id}
                className={`relative rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                  darkMode
                    ? n.read
                      ? "border-gray-800 bg-gray-900"
                      : "border-indigo-500/30 bg-indigo-500/5"
                    : n.read
                    ? "border-gray-200 bg-white"
                    : "border-indigo-200 bg-indigo-50"
                }`}
              >
                {!n.read && <span className="absolute left-4 top-5 h-2 w-2 rounded-full bg-indigo-500" />}

                <div className="flex items-start justify-between gap-4 pl-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        darkMode ? "bg-gray-800 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      <Ticket size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{n.message}</p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className={darkMode ? "text-gray-500" : "text-gray-400"}>{formatTime(n.createdAt)}</span>
                        {n.priority && (
                          <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${PRIORITY_META[n.priority] || PRIORITY_META.low}`}>
                            {n.priority}
                          </span>
                        )}
                        <span className={darkMode ? "text-gray-500" : "text-gray-400"}>Ticket ID: {n.ticketId || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleView(n)}
                      title="View details"
                      className={`rounded-full p-2 transition ${
                        darkMode ? "text-indigo-400 hover:bg-gray-800" : "text-indigo-600 hover:bg-indigo-100"
                      }`}
                    >
                      <Bell size={16} />
                    </button>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      title="Delete notification"
                      className={`rounded-full p-2 transition ${
                        darkMode ? "text-red-400 hover:bg-gray-800" : "text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {canAct && (
                  <div className={`ml-4 mt-4 space-y-2 border-t pt-4 ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
                    {users.length > 0 && (
                      <div className="flex max-w-md gap-2">
                        <select
                          value={assignee[n.id] || ""}
                          onChange={(e) => setAssignee((prev) => ({ ...prev, [n.id]: e.target.value }))}
                          disabled={isBusy}
                          className={`flex-1 rounded-lg border px-2 py-1.5 text-sm ${
                            darkMode ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-gray-50"
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
                          disabled={!assignee[n.id] || isBusy}
                          onClick={() => handleAssign(n)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <UserPlus size={14} />
                          Assign
                        </button>
                      </div>
                    )}

                    <div className="grid max-w-md grid-cols-3 gap-2">
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(n, "in_progress")}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1.5 text-sm font-medium text-blue-500 transition hover:bg-blue-500/20 disabled:opacity-40"
                      >
                        <Clock size={14} />
                        In Progress
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(n, "approved")}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-500/10 px-2 py-1.5 text-sm font-medium text-green-500 transition hover:bg-green-500/20 disabled:opacity-40"
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(n, "declined")}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-500/10 px-2 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-500/20 disabled:opacity-40"
                      >
                        <XCircle size={14} />
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
            <h2 className="mb-4 text-lg font-bold">Ticket Details</h2>

            <p className="mb-2">
              <span className="font-semibold">TITLE:</span> {selected.ticketTitle || "No title available"}
            </p>
            <p className="mb-2">
              <span className="font-semibold">PRIORITY:</span> {selected.priority || "N/A"}
            </p>
            <p className="mb-2">
              <span className="font-semibold">FROM:</span> {selected.requesterEmail || "N/A"}
            </p>
            <p className="mt-3 text-xs opacity-60">{formatTime(selected.createdAt)}</p>

            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2 text-white transition hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}