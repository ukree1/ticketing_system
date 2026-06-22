import { useEffect, useState } from "react"
import { auth } from "../firebase"
import useRole from "../hooks/useRole"

import {
  createTicket,
  listenToTickets
} from "../services/ticketService"

import TicketTable from "../components/tickets/TicketTable"
import TicketFilters from "../components/tickets/TicketFilters"
import TicketModal from "../components/tickets/TicketModal"

export default function Tickets() {
  const role = useRole()

  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("low")

  const [selectedTicket, setSelectedTicket] = useState(null)
  const [openModal, setOpenModal] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub = null

    const init = async () => {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      unsub = await listenToTickets((data) => {
        setTickets(data)
        setFilteredTickets(data)
        setLoading(false)
      }, user)
    }

    init()

    return () => {
      if (unsub) unsub()
    }
  }, [])

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return

    try {
      await createTicket({
        title,
        description,
        priority
      })

      setTitle("")
      setDescription("")
      setPriority("low")
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket)
    setOpenModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Ticket Management
          </h1>

          <p className="text-gray-500 mt-1">
            Welcome {auth.currentUser?.email || "User"}
          </p>
        </div>

        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          {role ? role.toUpperCase() : "LOADING"}
        </span>
      </div>

      {/* CREATE */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">

        <h2 className="text-xl font-semibold mb-4">
          Create Ticket
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            className="border rounded-lg p-3"
            placeholder="Ticket Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="border rounded-lg p-3"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

        </div>

        <textarea
          className="border rounded-lg p-3 mt-4 w-full"
          rows={4}
          placeholder="Ticket Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={handleCreate}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Create Ticket
        </button>
      </div>

      <TicketFilters
        tickets={tickets}
        setFiltered={setFilteredTickets}
      />

      {loading ? (
        <div className="text-gray-500 mt-4">
          Loading tickets...
        </div>
      ) : (
        <TicketTable
          tickets={filteredTickets}
          role={role}
          onEdit={handleEdit}
        />
      )}

      <TicketModal
        open={openModal}
        ticket={selectedTicket}
        refresh={() => {}}
        onClose={() => {
          setOpenModal(false)
          setSelectedTicket(null)
        }}
      />

    </div>
  )
}