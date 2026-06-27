import TicketRow from "./TicketRow";
import { useTheme } from "../../context/ThemeContext";

export default function TicketTable({
  tickets,
  refresh,
  role,
  onEdit
}) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-xl shadow overflow-hidden transition ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div className="overflow-x-auto">

        <table className="min-w-full">

          {/* HEADER */}
          <thead
            className={
              darkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700"
            }
          >
            <tr className="text-left">

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

          {/* BODY */}
          <tbody
            className={
              darkMode ? "text-gray-200" : "text-gray-800"
            }
          >
            {tickets.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className={
                    darkMode
                      ? "text-center py-10 text-gray-400"
                      : "text-center py-10 text-gray-500"
                  }
                >
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
  );
}