import { useEffect, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function TicketFilters({ tickets, setFiltered }) {
  const { darkMode } = useTheme();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const [result, setResult] = useState(tickets);

  useEffect(() => {
    let list = [...tickets];

    if (search.trim() !== "") {
      list = list.filter((ticket) =>
        (ticket.title || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== "all") {
      list = list.filter((ticket) => ticket.status === status);
    }

    if (priority !== "all") {
      list = list.filter((ticket) => ticket.priority === priority);
    }

    setResult(list);
    setFiltered(list);
  }, [search, status, priority, tickets, setFiltered]);

  const hasActiveFilters = search !== "" || status !== "all" || priority !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
  };

  const inputClass = darkMode
    ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500 focus:ring-indigo-500"
    : "bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400 focus:ring-indigo-500";

  return (
    <div
      className={`rounded-2xl shadow-sm border p-4 mb-5 transition ${
        darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        {/* SEARCH */}
        <div className="relative flex-1">
          <Search
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="Search by ticket title..."
            className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 transition ${inputClass}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATUS */}
        <select
          className={`border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${inputClass}`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending Review</option>
          <option value="in_progress">In Progress</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>

        {/* PRIORITY */}
        <select
          className={`border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${inputClass}`}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* RESULT COUNT */}
      <div
        className={`flex items-center gap-1.5 text-xs mt-3 ${
          darkMode ? "text-gray-500" : "text-gray-400"
        }`}
      >
        <SlidersHorizontal size={12} />
        {result.length} of {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}