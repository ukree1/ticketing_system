import { useEffect, useState } from "react";
import { BarChart3, ListChecks, Moon, PieChart, Sun, TrendingUp } from "lucide-react";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";
import useNotifications from "../hooks/useNotifications";
import useBroadcasts from "../hooks/useBroadcasts";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";
import NotificationBell from "../components/notifications/NotificationBell";
import NotificationSidebar from "../components/notifications/NotificationSidebar";
import MessageBell from "../components/messages/MessageBell";
import MessageSidebar from "../components/messages/MessageSidebar";
import { listenDashboardStats } from "../services/dashboardService";
import { getUsers } from "../services/userService";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";
import { reviewTicket, assignTicket } from "../services/ticketService";
import { useTheme } from "../context/ThemeContext";

export default function Dashboard() {
  const role = useRole();
  const isAdmin = role === "admin";
  const { darkMode, toggleDarkMode } = useTheme();
  const { notifications, unreadCount } = useNotifications();
  const {
    messages: broadcasts,
    loading: broadcastsLoading,
    unreadCount: unreadMessages,
  } = useBroadcasts(isAdmin);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    approved: 0,
    declined: 0,
  });

  const [notifOpen, setNotifOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let unsubscribeDashboard = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      unsubscribeDashboard();

      if (!user) {
        setStats({ total: 0, pending: 0, inProgress: 0, approved: 0, declined: 0 });
        return;
      }

      try {
        unsubscribeDashboard = await listenDashboardStats(user.uid, setStats);
      } catch (error) {
        console.error("Dashboard:", error);
      }
    });

    return () => {
      unsubscribeDashboard();
      unsubscribeAuth();
    };
  }, []);

  // Admins need the user list to populate the "Assign to…" dropdown in
  // the notification sidebar.
  useEffect(() => {
    if (!isAdmin) return;

    getUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => console.error("Dashboard users:", err));
  }, [isAdmin]);

  const handleMarkRead = (id) => markNotificationAsRead(id);

  const handleMarkAllRead = () => {
    const uid = auth.currentUser?.uid;
    if (uid) markAllNotificationsAsRead(uid);
  };

  const handleDelete = (id) => deleteNotification(id);

  // assignTicket() already creates the "ticket_assigned" notification for
  // the assignee, so there's nothing extra to send here.
  const handleAssign = async (notification, user) => {
    if (!user) return;
    setBusyId(notification.id);

    try {
      await assignTicket(
        notification.ticketId,
        user.uid,
        user.email,
        user.name || user.email,
        notification.ticketTitle || ""
      );
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error("Assign ticket:", error);
      alert("Couldn't assign the ticket. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // reviewTicket() already notifies the ticket's creator with the right
  // status message, so there's nothing extra to send here either.
  const handleStatusChange = async (notification, status) => {
    setBusyId(notification.id);

    try {
      await reviewTicket(
        {
          id: notification.ticketId,
          title: notification.ticketTitle,
          createdBy: notification.requesterUid,
        },
        status
      );
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error("Update ticket status:", error);
      alert("Couldn't update the ticket status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const totalTickets = Math.max(stats.total, 1);

  const statusBreakdown = [
    {
      label: "Pending",
      value: stats.pending,
      color: "bg-amber-500",
      hex: "#f59e0b",
      width: `${(stats.pending / totalTickets) * 100}%`,
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      color: "bg-blue-500",
      hex: "#3b82f6",
      width: `${(stats.inProgress / totalTickets) * 100}%`,
    },
    {
      label: "Approved",
      value: stats.approved,
      color: "bg-green-500",
      hex: "#22c55e",
      width: `${(stats.approved / totalTickets) * 100}%`,
    },
    {
      label: "Declined",
      value: stats.declined,
      color: "bg-red-500",
      hex: "#ef4444",
      width: `${(stats.declined / totalTickets) * 100}%`,
    },
  ];

  const monthlyTickets = [8, 14, 11, 18, 24, 21, 28, 32, 27, 35, 31, 40];
  const maxMonthly = Math.max(...monthlyTickets, 1);

  const linePoints = monthlyTickets
    .map((value, index) => {
      const x = (index / (monthlyTickets.length - 1)) * 100;
      const y = 100 - (value / maxMonthly) * 85;
      return `${x},${y}`;
    })
    .join(" ");

  let cumulative = 0;
  const pieStops = statusBreakdown
    .map((item) => {
      const start = cumulative;
      const pct = (item.value / totalTickets) * 100;
      cumulative += pct;
      return `${item.hex} ${start}% ${cumulative}%`;
    })
    .join(", ");

  return (
    <MainLayout>
      <div
        className={`min-h-screen w-full transition-all duration-300 ${
          darkMode ? "bg-black text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 pb-24 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8 lg:pb-8">
          {/* HEADER */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-indigo-500 sm:text-3xl">Dashboard</h1>

              <p className="mt-1 truncate text-sm opacity-70">
                Welcome, {auth.currentUser?.email}
              </p>

              <p className="mt-1 inline-flex items-center gap-1.5 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {role ? role.toUpperCase() : "LOADING"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <MessageBell
                unreadCount={unreadMessages}
                darkMode={darkMode}
                onClick={() => setMessagesOpen(true)}
              />

              <NotificationBell
                unreadCount={unreadCount}
                darkMode={darkMode}
                onClick={() => setNotifOpen(true)}
              />

              <button
                onClick={toggleDarkMode}
                className={`inline-flex h-11 w-fit items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${
                  darkMode
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6 xl:grid-cols-5">
            <DashboardCard title="Total Tickets" value={stats.total} color="bg-indigo-500" />
            <DashboardCard title="Pending" value={stats.pending} color="bg-amber-500" />
            <DashboardCard title="In Progress" value={stats.inProgress} color="bg-blue-500" />
            <DashboardCard title="Approved" value={stats.approved} color="bg-green-500" />
            <DashboardCard title="Declined" value={stats.declined} color="bg-red-500" />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <section
              className={`rounded-2xl p-4 shadow-sm ring-1 sm:p-6 ${
                darkMode ? "bg-gray-900 ring-gray-800" : "bg-white ring-gray-100"
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold sm:text-lg">Ticket Status</h2>
                <BarChart3 className="text-indigo-500" size={22} />
              </div>

              <div className="flex h-52 items-end gap-3 sm:h-56 sm:gap-5">
                {statusBreakdown.map((item) => (
                  <div key={item.label} className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className={`flex h-36 items-end rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${item.color}`}
                        style={{ height: `${Math.max((item.value / totalTickets) * 100, 8)}%` }}
                      />
                    </div>

                    <div className="text-center">
                      <p className="truncate text-xs font-medium sm:text-sm">{item.label}</p>
                      <p className="text-xs opacity-60">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              className={`rounded-2xl p-4 shadow-sm ring-1 sm:p-6 ${
                darkMode ? "bg-gray-900 ring-gray-800" : "bg-white ring-gray-100"
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold sm:text-lg">Status Breakdown</h2>
                <PieChart className="text-indigo-500" size={22} />
              </div>

              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div
                  className="h-36 w-36 shrink-0 rounded-full sm:h-44 sm:w-44"
                  style={{ background: `conic-gradient(${pieStops})` }}
                />

                <div className="w-full space-y-4">
                  {statusBreakdown.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`h-3 w-3 shrink-0 rounded-full ${item.color}`} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span>{item.value}</span>
                      </div>

                      <div className={`h-2 rounded-full ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${item.color}`}
                          style={{ width: item.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* LINE CHART */}
          <section
            className={`rounded-2xl p-4 shadow-sm ring-1 sm:p-6 ${
              darkMode ? "bg-gray-900 ring-gray-800" : "bg-white ring-gray-100"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                <TrendingUp size={18} className="text-indigo-500" />
                Monthly Line Chart
              </h2>
              <ListChecks className="text-indigo-500" size={22} />
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <svg viewBox="0 0 100 110" className="h-56 w-full sm:h-64" preserveAspectRatio="none">
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {monthlyTickets.map((value, index) => {
                    const x = (index / (monthlyTickets.length - 1)) * 100;
                    const y = 100 - (value / maxMonthly) * 85;
                    return <circle key={index} cx={x} cy={y} r="1.8" fill="#6366f1" />;
                  })}
                </svg>

                <div className="grid grid-cols-12 gap-2 text-center text-xs opacity-60">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                    (month) => (
                      <span key={month}>{month}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <NotificationSidebar
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        isAdmin={isAdmin}
        users={users}
        darkMode={darkMode}
        busyId={busyId}
        onAssign={handleAssign}
        onStatusChange={handleStatusChange}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
      />

      <MessageSidebar
        isOpen={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        messages={broadcasts}
        loading={broadcastsLoading}
        isAdmin={isAdmin}
        darkMode={darkMode}
      />
    </MainLayout>
  );
}