import { Pencil, Trash2, CheckCircle } from "lucide-react"
import StatusBadge from "./StatusBadge"
import { updateTicket, deleteTicket } from "../../services/ticketService"

export default function TicketRow({
  ticket,
  refresh,
  role,
  onEdit
}) {

  const handleClose = async () => {
    try {
      await updateTicket(ticket.id, {
        status: "closed"
      })

      refresh()
    } catch (err) {
      console.log(err)
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Delete this ticket?")
    if (!confirmDelete) return

    try {
      await deleteTicket(ticket.id)
      refresh()
    } catch (err) {
      console.log(err)
    }
  }

  const priorityColor = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-green-100 text-green-700"
  }

  return (
    <tr className="border-b hover:bg-gray-50 transition">

      {/* TITLE */}
      <td className="px-4 py-3 font-medium">
        {ticket.title || "No Title"}
      </td>

      {/* CREATED BY (SAFE DISPLAY) */}
      <td className="px-4 py-3">
        {ticket.createdByEmail ||
         ticket.createdBy ||
         "Unknown User"}
      </td>

      {/* ASSIGNED TO */}
      <td className="px-4 py-3">
        {ticket.assignedTo || "-"}
      </td>

      {/* STATUS */}
      <td className="px-4 py-3">
        <StatusBadge status={ticket.status} />
      </td>

      {/* PRIORITY */}
      <td className="px-4 py-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          priorityColor[ticket.priority] || "bg-gray-200"
        }`}>
          {ticket.priority || "low"}
        </span>
      </td>

      {/* CREATED DATE */}
      <td className="px-4 py-3">
        {ticket.createdAt?.toDate
          ? ticket.createdAt.toDate().toLocaleDateString()
          : "-"}
      </td>

      {/* ACTIONS */}
      <td className="px-4 py-3">
        <div className="flex gap-2">

          <button
            onClick={() => onEdit(ticket)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={handleClose}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg"
          >
            <CheckCircle size={16} />
          </button>

          {role === "admin" && (
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          )}

        </div>
      </td>

    </tr>
  )
}