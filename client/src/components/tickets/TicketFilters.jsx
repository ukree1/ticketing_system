import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function TicketFilters({ tickets, setFiltered }) {
  const { darkMode } = useTheme();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  useEffect(() => {
    let result = [...tickets];

    // Search
    if (search.trim() !== "") {
      result = result.filter((ticket) =>
        ticket.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status
    if (status !== "all") {
      result = result.filter((ticket) => ticket.status === status);
    }

    // Priority
    if (priority !== "all") {
      result = result.filter((ticket) => ticket.priority === priority);
    }

    setFiltered(result);
  }, [search, status, priority, tickets, setFiltered]);

  return (
    <div
      className={`rounded-xl shadow p-4 flex flex-col md:flex-row gap-4 mb-5 transition ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search ticket..."
        className={`border rounded-lg px-3 py-2 flex-1 outline-none transition ${
          darkMode
            ? "bg-gray-800 text-white border-gray-700 placeholder-gray-400"
            : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-500"
        }`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* STATUS */}
      <select
        className={`border rounded-lg px-3 py-2 outline-none transition ${
          darkMode
            ? "bg-gray-800 text-white border-gray-700"
            : "bg-gray-50 text-gray-900 border-gray-300"
        }`}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="closed">Closed</option>
      </select>

      {/* PRIORITY */}
      <select
        className={`border rounded-lg px-3 py-2 outline-none transition ${
          darkMode
            ? "bg-gray-800 text-white border-gray-700"
            : "bg-gray-50 text-gray-900 border-gray-300"
        }`}
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="all">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

    </div>
  );
}