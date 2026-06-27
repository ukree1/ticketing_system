import { useEffect, useState } from "react";
import { auth } from "../firebase";
import useRole from "../hooks/useRole";

import {
  createTicket,
  listenToTickets
} from "../services/ticketService";

import TicketTable from "../components/tickets/TicketTable";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketModal from "../components/tickets/TicketModal";

import { useTheme } from "../context/ThemeContext";

export default function Tickets() {
  const role = useRole();
  const { darkMode } = useTheme();

  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("low");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [loading, setLoading] = useState(true);

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

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      await createTicket({
        title,
        description,
        priority
      });

      setTitle("");
      setDescription("");
      setPriority("low");
    } catch (err) {
      console.error(err);
      alert(err.message);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-500">
            Ticket Management
          </h1>

          <p className="text-sm opacity-70 mt-1">
            Welcome {auth.currentUser?.email || "User"}
          </p>
        </div>

        <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          {role ? role.toUpperCase() : "LOADING"}
        </span>
      </div>

      {/* CREATE TICKET */}
      <div
        className={`rounded-2xl shadow p-6 mb-6 transition ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">
          Create Ticket
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            className={`border rounded-lg p-3 outline-none transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300"
            }`}
            placeholder="Ticket Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className={`border rounded-lg p-3 transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300"
            }`}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

        </div>

        <textarea
          className={`border rounded-lg p-3 mt-4 w-full outline-none transition ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300"
          }`}
          rows={4}
          placeholder="Ticket Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={handleCreate}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
        >
          Create Ticket
        </button>
      </div>

      {/* FILTERS */}
      <TicketFilters
        tickets={tickets}
        setFiltered={setFilteredTickets}
      />

      {/* TABLE */}
      {loading ? (
        <div className="text-center opacity-70 mt-6">
          Loading tickets...
        </div>
      ) : (
        <div
          className={`rounded-2xl overflow-hidden shadow mt-4 ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
          <TicketTable
            tickets={filteredTickets}
            role={role}
            onEdit={handleEdit}
          />
        </div>
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