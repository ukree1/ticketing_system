import { useEffect, useState } from "react"

export default function TicketFilters({ tickets, setFiltered }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("all")

  useEffect(() => {
    let result = [...tickets]

    // Search
    if (search.trim() !== "") {
      result = result.filter((ticket) =>
        ticket.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Status
    if (status !== "all") {
      result = result.filter((ticket) => ticket.status === status)
    }

    // Priority
    if (priority !== "all") {
      result = result.filter((ticket) => ticket.priority === priority)
    }

    setFiltered(result)
  }, [search, status, priority, tickets, setFiltered])

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-4 mb-5">
      <input
        type="text"
        placeholder="Search ticket..."
        className="border rounded-lg px-3 py-2 flex-1"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="border rounded-lg px-3 py-2"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="closed">Closed</option>
      </select>

      <select
        className="border rounded-lg px-3 py-2"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="all">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  )
}