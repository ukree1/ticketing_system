import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";

import { createTicket, listenToTickets } from "../services/ticketService";
import { getUsers } from "../services/userService";

import TicketTable from "../components/tickets/TicketTable";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketModal from "../components/tickets/TicketModal";

import { useTheme } from "../context/ThemeContext";

export default function Tickets() {
  const navigate = useNavigate();
  const role = useRole();
  const { darkMode } = useTheme();

  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

  const [users, setUsers] = useState([]);
  const [assignedToUid, setAssignedToUid] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("low");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = role === "admin";

  // ================= USERS (admin only, for the assign dropdown) =================
  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadUsers();
  }, [isAdmin]);

  // ================= TICKETS =================
  useEffect(() => {
    let unsubscribe = () => {};

    const authUnsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      unsubscribe = await listenToTickets(
        (data) => {
          setTickets(data);
          setFilteredTickets(data);
          setLoading(false);
        },
        user
      );
    });

    return () => {
      authUnsub();
      unsubscribe();
    };
  }, []);

  // ================= CREATE =================
  // Any signed-in user (admin or regular user) can submit a ticket.
  // It starts as "pending". createTicket() already notifies the assignee
  // (if any) and every admin (if a non-admin submitted it) — no need to
  // duplicate that here.
  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const selectedUser = users.find((u) => u.uid === assignedToUid);

      await createTicket({
        title,
        description,
        priority,

        assignedToUid: isAdmin ? selectedUser?.uid || "" : "",
        assignedToEmail: isAdmin ? selectedUser?.email || "" : "",
        assignedToName: isAdmin ? selectedUser?.name || selectedUser?.email || "" : "",
      });

      setTitle("");
      setDescription("");
      setPriority("low");
      setAssignedToUid("");

      alert(
        isAdmin ? "Ticket created successfully!" : "Ticket submitted! An admin will review it shortly."
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket);
    setOpenModal(true);
  };

  return (
    <div
      className={`min-h-screen p-6 transition-all duration-300 ${
        darkMode ? "bg-black text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white shadow hover:bg-gray-200"
            }`}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold text-indigo-500">Ticket Management</h1>
            <p className="text-sm opacity-70 mt-1">Welcome {auth.currentUser?.email || "User"}</p>
          </div>
        </div>

        <span className="self-start rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white md:self-auto">
          {role ? role.toUpperCase() : "LOADING"}
        </span>
      </div>

      {/* CREATE TICKET — available to everyone */}
      <div className={`rounded-2xl p-6 shadow mb-6 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
        <h2 className="text-xl font-semibold mb-1">{isAdmin ? "Create Ticket" : "Submit a Ticket"}</h2>
        <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {isAdmin
            ? "Create a ticket and optionally assign it to a user."
            : "Your ticket will be sent to an admin for review."}
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            className={`rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
              darkMode ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-gray-50"
            }`}
            placeholder="Ticket Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className={`rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
              darkMode ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-gray-50"
            }`}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* ADMIN ONLY ASSIGN */}
        {isAdmin && (
          <div className="mt-4">
            <select
              className={`w-full rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                darkMode ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-gray-50"
              }`}
              value={assignedToUid}
              onChange={(e) => setAssignedToUid(e.target.value)}
            >
              <option value="">Assign To (Optional)</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <textarea
          className={`mt-4 w-full rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
            darkMode ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-gray-50"
          }`}
          rows={4}
          placeholder="Ticket Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={handleCreate}
          disabled={submitting}
          className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting…" : isAdmin ? "Create Ticket" : "Submit Ticket"}
        </button>
      </div>

      {/* FILTERS */}
      <TicketFilters tickets={tickets} setFiltered={setFilteredTickets} />

      {/* TABLE */}
      {loading ? (
        <div className="text-center mt-6">Loading tickets...</div>
      ) : (
        <TicketTable tickets={filteredTickets} role={role} onEdit={handleEdit} />
      )}

      {/* MODAL */}
      <TicketModal
        open={openModal}
        ticket={selectedTicket}
        refresh={() => {}}
        onClose={() => {
          setOpenModal(false);
          setSelectedTicket(null);
        }}
      />
    </div>
  );
}