import { useEffect, useState } from "react";
import { BarChart3, ListChecks, Moon, PieChart, Sun, TrendingUp } from "lucide-react";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";
import useNotifications from "../hooks/useNotifications.js";
import useBroadcasts from "../hooks/useBroadcasts";
import MainLayout from "../layouts/MainLayout";
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

/* ---------- small presentational pieces ---------- */

function StatCard({ label, value, dot, primary, darkMode }) {
  if (primary) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-violet-600 p-4 text-white shadow-[0_18px_36px_-14px_rgba(124,58,237,0.7)] sm:p-5">
        <p className="text-xs font-medium text-violet-100 sm:text-sm">{label}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
        darkMode
          ? "border-white/10 bg-[#0b0b10] hover:border-violet-500/50"
          : "border-violet-100 bg-white hover:border-violet-300"
      }`}
    >
      <p className={`flex items-center gap-2 text-xs font-medium sm:text-sm ${darkMode ? "text-zinc-400" : "text-zinc-500"}`}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, darkMode, children }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-sm font-semibold sm:text-base">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            darkMode ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"
          }`}
        >
          <Icon size={18} />
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

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
    monthlyCounts: new Array(12).fill(0),
    year: new Date().getFullYear(),
  });

  const [notifOpen, setNotifOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // Keep the <body> background in sync with the theme (no white edges)
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#000000" : "#faf8ff";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [darkMode]);

  useEffect(() => {
    let unsubscribeDashboard = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      unsubscribeDashboard();

      if (!user) {
        setStats({
          total: 0,
          pending: 0,
          inProgress: 0,
          approved: 0,
          declined: 0,
          monthlyCounts: new Array(12).fill(0),
          year: new Date().getFullYear(),
        });
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

  /* ---------- derived chart data ---------- */
  const totalTickets = Math.max(stats.total, 1);

  // Violet-only palette. Four clearly different shades, tuned for each theme.
  const shades = darkMode
    ? ["#ede9fe", "#c4b5fd", "#8b5cf6", "#5b21b6"]
    : ["#c4b5fd", "#a78bfa", "#7c3aed", "#4c1d95"];

  const statusBreakdown = [
    { label: "Pending", value: stats.pending, hex: shades[0], width: `${(stats.pending / totalTickets) * 100}%` },
    { label: "In Progress", value: stats.inProgress, hex: shades[1], width: `${(stats.inProgress / totalTickets) * 100}%` },
    { label: "Approved", value: stats.approved, hex: shades[2], width: `${(stats.approved / totalTickets) * 100}%` },
    { label: "Declined", value: stats.declined, hex: shades[3], width: `${(stats.declined / totalTickets) * 100}%` },
  ];

  const monthlyTickets = stats.monthlyCounts || new Array(12).fill(0);
  const maxMonthly = Math.max(...monthlyTickets, 1);
  const hasMonthlyData = monthlyTickets.some((v) => v > 0);

  // Line chart geometry. x positions line up with the 12 month labels below.
  const W = 600;
  const H = 200;
  const padT = 16;
  const padB = 12;
  const points = monthlyTickets.map((v, i) => ({
    x: ((i + 0.5) / monthlyTickets.length) * W,
    y: padT + (1 - v / maxMonthly) * (H - padT - padB),
  }));
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = points.length
    ? `M${points[0].x},${H - padB} ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${H - padB} Z`
    : "";

  let cumulative = 0;
  const pieStops = statusBreakdown
    .map((item) => {
      const start = cumulative;
      const pct = (item.value / totalTickets) * 100;
      cumulative += pct;
      return `${item.hex} ${start}% ${cumulative}%`;
    })
    .join(", ");
  const pieBackground = stats.total
    ? `conic-gradient(${pieStops})`
    : darkMode ? "#27272a" : "#ede9fe";

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* ---------- theme classes ---------- */
  const card = darkMode
    ? "border-white/10 bg-[#0b0b10]"
    : "border-violet-100 bg-white shadow-[0_1px_2px_rgba(76,29,149,0.04),0_14px_34px_-14px_rgba(109,40,217,0.18)]";
  const muted = darkMode ? "text-zinc-400" : "text-zinc-500";
  const track = darkMode ? "bg-white/10" : "bg-violet-100";

  return (
    <MainLayout>
      {/* Full-bleed background layer behind MainLayout's container */}
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-300 ${
          darkMode ? "bg-black" : "bg-[#faf8ff]"
        }`}
      />

      <div
        className={`min-h-screen w-full transition-colors duration-300 ${
          darkMode ? "bg-black text-zinc-100" : "bg-[#faf8ff] text-zinc-900"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-5 pb-24 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:pb-10">
          {/* HEADER */}
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Dashboard</h1>
              <p className={`mt-1.5 truncate text-sm ${muted}`}>
                Welcome back, {auth.currentUser?.email}
              </p>
              <span
                className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  darkMode ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"
                }`}
              >
                {role ? role.toUpperCase() : "LOADING"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <MessageBell unreadCount={unreadMessages} darkMode={darkMode} onClick={() => setMessagesOpen(true)} />
              <NotificationBell unreadCount={unreadCount} darkMode={darkMode} onClick={() => setNotifOpen(true)} />

              <button
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className={`grid h-10 w-10 place-items-center rounded-full border transition sm:h-11 sm:w-11 ${
                  darkMode
                    ? "border-white/15 text-zinc-100 hover:bg-white/10"
                    : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                }`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          {/* STAT CARDS */}
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <StatCard primary label="Total Tickets" value={stats.total} darkMode={darkMode} />
            </div>
            <StatCard label="Pending" value={stats.pending} dot={shades[0]} darkMode={darkMode} />
            <StatCard label="In Progress" value={stats.inProgress} dot={shades[1]} darkMode={darkMode} />
            <StatCard label="Approved" value={stats.approved} dot={shades[2]} darkMode={darkMode} />
            <StatCard label="Declined" value={stats.declined} dot={shades[3]} darkMode={darkMode} />
          </section>

          {/* MONTHLY + BREAKDOWN */}
          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
            <section className={`rounded-3xl border p-4 sm:p-6 xl:col-span-2 ${card}`}>
              <SectionHeader icon={TrendingUp} darkMode={darkMode} title={`Monthly Tickets${stats.year ? ` (${stats.year})` : ""}`}>
                {hasMonthlyData && <span className={`text-xs ${muted}`}>Peak: {maxMonthly}</span>}
              </SectionHeader>

              {hasMonthlyData ? (
                <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Line chart of tickets created per month">
                  <defs>
                    <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={darkMode ? 0.35 : 0.28} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[0, 0.5, 1].map((t) => {
                    const y = padT + t * (H - padT - padB);
                    return (
                      <line key={t} x1="0" x2={W} y1={y} y2={y}
                        stroke={darkMode ? "#ffffff" : "#7c3aed"} strokeOpacity={darkMode ? 0.08 : 0.12} strokeDasharray="4 6" />
                    );
                  })}

                  <path d={areaPath} fill="url(#dash-area)" />
                  <polyline points={linePoints} fill="none" stroke="#8b5cf6" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" />

                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4.5" fill={darkMode ? "#000" : "#fff"} stroke="#8b5cf6" strokeWidth="2.5">
                      <title>{`${monthLabels[i]}: ${monthlyTickets[i]}`}</title>
                    </circle>
                  ))}
                </svg>
              ) : (
                <div className={`flex h-44 items-center justify-center text-sm sm:h-56 ${muted}`}>
                  No tickets created yet this year.
                </div>
              )}

              <div className={`mt-2 grid grid-cols-12 text-center text-[9px] sm:text-xs ${muted}`}>
                {monthLabels.map((month, index) => (
                  <span key={month} className={index % 2 !== 0 ? "invisible sm:visible" : ""}>
                    {month}
                  </span>
                ))}
              </div>
            </section>

            <section className={`rounded-3xl border p-4 sm:p-6 ${card}`}>
              <SectionHeader icon={PieChart} darkMode={darkMode} title="Status Breakdown" />

              <div className="flex flex-col items-center gap-6">
                <div className="relative h-40 w-40 shrink-0 rounded-full sm:h-44 sm:w-44" style={{ background: pieBackground }}>
                  <div className={`absolute inset-[22px] grid place-items-center rounded-full ${darkMode ? "bg-[#0b0b10]" : "bg-white"}`}>
                    <div className="text-center">
                      <p className="text-3xl font-bold leading-none">{stats.total}</p>
                      <p className={`mt-1 text-xs ${muted}`}>Total</p>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3.5">
                  {statusBreakdown.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex justify-between gap-3 text-xs sm:text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.hex }} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${track}`}>
                        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: item.width, backgroundColor: item.hex }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* TICKET STATUS BARS */}
          <section className={`rounded-3xl border p-4 sm:p-6 ${card}`}>
            <SectionHeader icon={BarChart3} darkMode={darkMode} title="Ticket Status">
              <ListChecks size={18} className={muted} />
            </SectionHeader>

            <div className="grid grid-cols-4 gap-3 sm:gap-6">
              {statusBreakdown.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-col gap-3">
                  <div className={`flex h-32 items-end rounded-2xl p-1.5 sm:h-40 ${track}`}>
                    <div
                      className="w-full rounded-xl transition-all duration-500"
                      style={{ height: `${Math.max((item.value / totalTickets) * 100, 8)}%`, backgroundColor: item.hex }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="truncate text-[11px] font-medium sm:text-sm">{item.label}</p>
                    <p className={`text-[11px] sm:text-xs ${muted}`}>{item.value}</p>
                  </div>
                </div>
              ))}
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