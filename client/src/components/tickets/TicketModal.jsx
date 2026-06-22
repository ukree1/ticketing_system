import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { updateTicket } from "../../services/ticketService"

export default function TicketModal({
  open,
  onClose,
  ticket,
  refresh
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("low")
  const [status, setStatus] = useState("open")
  const [assignedTo, setAssignedTo] = useState("")

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || "")
      setDescription(ticket.description || "")
      setPriority(ticket.priority || "low")
      setStatus(ticket.status || "open")
      setAssignedTo(ticket.assignedTo || "")
    }
  }, [ticket])

  if (!open) return null

  const handleSave = async () => {
    try {
      await updateTicket(ticket.id, {
        title,
        description,
        priority,
        status,
        assignedTo
      })

      refresh()
      onClose()
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

      <div className="bg-white rounded-xl w-full max-w-xl p-6 relative">

        <button
          onClick={onClose}
          className="absolute right-5 top-5"
        >
          <X />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          Edit Ticket
        </h2>

        <div className="space-y-4">

          <input
            className="w-full border rounded-lg p-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />

          <textarea
            rows="4"
            className="w-full border rounded-lg p-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />

          <select
            className="w-full border rounded-lg p-3"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            className="w-full border rounded-lg p-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Assign User Email"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />

          <div className="flex justify-end gap-3">

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-300"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white"
            >
              Save Changes
            </button>

          </div>
f
        </div>

      </div>

    </div>
  )
}