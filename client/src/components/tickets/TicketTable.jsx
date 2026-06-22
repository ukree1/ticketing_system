import TicketRow from "./TicketRow"

export default function TicketTable({
  tickets,
  refresh,
  role,
  onEdit
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-100">

            <tr className="text-left text-gray-700">

              <th className="px-4 py-3 font-semibold">
                Title
              </th>

              <th className="px-4 py-3 font-semibold">
                Created By (User)
              </th>

              <th className="px-4 py-3 font-semibold">
                Assigned To
              </th>

              <th className="px-4 py-3 font-semibold">
                Status
              </th>

              <th className="px-4 py-3 font-semibold">
                Priority
              </th>

              <th className="px-4 py-3 font-semibold">
                Created
              </th>

              <th className="px-4 py-3 font-semibold text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {tickets.length === 0 ? (

              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-500">
                  No tickets found.
                </td>
              </tr>

            ) : (

              tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  refresh={refresh}
                  role={role}
                  onEdit={onEdit}
                />
              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}