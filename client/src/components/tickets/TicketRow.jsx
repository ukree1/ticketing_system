import { Eye, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { deleteTicket } from "../../services/ticketService";
import { useTheme } from "../../context/ThemeContext";

const priorityColor = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  medium: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  low: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export default function TicketRow({ ticket, refresh, role, onEdit }) {
  const { darkMode } = useTheme();

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Delete "${ticket.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await deleteTicket(ticket.id);
      refresh?.();
    } catch (err) {
      console.log(err);
    }
  };

  const createdDate = ticket.createdAt?.toDate
    ? ticket.createdAt.toDate().toLocaleDateString()
    : "-";

  const assignedLabel = ticket.assignedToName
    ? ticket.assignedToName
    : ticket.assignedToEmail
    ? ticket.assignedToEmail
    : "Unassigned";

  const priorityBadge = (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
        priorityColor[ticket.priority] ||
        "bg-gray-500/10 text-gray-600 dark:text-gray-400"
      }`}
    >
      {ticket.priority || "low"}
    </span>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onEdit(ticket)}
        className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-lg transition"
        title="View Ticket"
      >
        <Eye size={16} />
      </button>

      {role === "admin" && (
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
          title="Delete Ticket"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* DESKTOP ROW */}
      <tr
        className={`hidden md:table-row transition ${
          darkMode
            ? "hover:bg-gray-800 border-gray-700"
            : "hover:bg-gray-50 border-gray-200"
        }`}
      >
        <td className="w-[18%] px-4 py-4 font-semibold truncate">
          {ticket.title || "No Title"}
        </td>

        <td className="w-[20%] px-4 py-4 truncate">
          {ticket.createdByEmail || ticket.createdBy || "Unknown User"}
        </td>

        <td
          className="w-[24%] px-4 py-4 truncate"
          title={ticket.assignedToName || ticket.assignedToEmail}
        >
          {assignedLabel}
        </td>

        <td className="w-[11%] px-4 py-4">
          <StatusBadge status={ticket.status} />
        </td>

        <td className="w-[10%] px-4 py-4">{priorityBadge}</td>

        <td className="w-[9%] px-4 py-4 whitespace-nowrap">{createdDate}</td>

        <td className="w-[8%] px-4 py-4">
          <div className="flex justify-center">{actions}</div>
        </td>
      </tr>

      {/* MOBILE CARD */}
      <tr className="md:hidden">
        <td colSpan={7} className="px-4 py-4">
          <div
            className={`rounded-xl border p-4 ${
              darkMode
                ? "border-gray-700 bg-gray-800/40"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="font-semibold truncate">
                {ticket.title || "No Title"}
              </p>
              {actions}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={ticket.status} />
              {priorityBadge}
            </div>

            <div
              className={`text-xs space-y-1 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <p>
                <span className="font-medium">Created by:</span>{" "}
                {ticket.createdByEmail || ticket.createdBy || "Unknown User"}
              </p>
              <p>
                <span className="font-medium">Assigned to:</span>{" "}
                {assignedLabel}
              </p>
              <p>
                <span className="font-medium">Created:</span> {createdDate}
              </p>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}