import { Inbox } from "lucide-react";
import TicketRow from "./TicketRow";
import { useTheme } from "../../context/ThemeContext";

export default function TicketTable({
  tickets = [],
  refresh,
  role,
  onEdit,
}) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden transition ${
        darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          {/* HEADER (desktop only) */}
          <thead
            className={`hidden md:table-header-group ${
              darkMode
                ? "bg-gray-800/60 text-gray-300"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            <tr>
              <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Title
              </th>
              <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Created By
              </th>
              <th className="w-[24%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Assigned To
              </th>
              <th className="w-[11%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Status
              </th>
              <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Priority
              </th>
              <th className="w-[9%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Created
              </th>
              <th className="w-[8%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody
            className={
              darkMode
                ? "divide-y divide-gray-700 text-gray-200"
                : "divide-y divide-gray-200 text-gray-800"
            }
          >
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox
                      size={28}
                      className={darkMode ? "text-gray-600" : "text-gray-300"}
                    />
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No tickets found
                    </p>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      Tickets you create or are assigned will show up here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={{
                    ...ticket,
                    assignedToName: ticket.assignedToName || "",
                    assignedToEmail: ticket.assignedToEmail || "",
                    assignedToUid: ticket.assignedToUid || "",
                  }}
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