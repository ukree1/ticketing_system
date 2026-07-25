import { useEffect, useState } from "react";
import { DownloadCloud, Printer, X, Ticket as TicketIcon, Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  updateTicket,
  assignTicket,
  reviewTicket,
} from "../../services/ticketService";
import { getUsers } from "../../services/userService";
import { useTheme } from "../../context/ThemeContext";
import useRole from "../../hooks/useRole";
import StatusBadge from "./StatusBadge";

const REVIEW_ACTIONS = [
  { value: "in_progress", label: "In Progress", icon: Clock, active: "bg-blue-600 text-white" },
  { value: "approved", label: "Approve", icon: CheckCircle2, active: "bg-green-600 text-white" },
  { value: "declined", label: "Decline", icon: XCircle, active: "bg-red-600 text-white" },
];

export default function TicketModal({
  open,
  onClose,
  ticket,
  refresh,
}) {
  const { darkMode } = useTheme();
  const role = useRole();
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("low");
  const [status, setStatus] = useState("pending");

  const [users, setUsers] = useState([]);
  const [assignedToUid, setAssignedToUid] = useState("");

  const isApproved = status === "approved";

  const getCsvContent = () => {
    const columns = [
      "Ticket ID",
      "Title",
      "Description",
      "Status",
      "Priority",
      "Created By",
      "Assigned To",
      "Created Date",
    ];

    const values = [
      ticket?.id || "",
      title || "",
      description || "",
      status || "",
      priority || "",
      ticket?.createdByEmail || ticket?.createdBy || "",
      ticket?.assignedToName || ticket?.assignedToEmail || "",
      ticket?.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : "",
    ];

    const escaped = values.map((value) => {
      const str = String(value || "");
      return `"${str.replace(/"/g, '""')}"`;
    });

    return `${columns.join(",")}\n${escaped.join(",")}`;
  };

  const downloadCsv = () => {
    const csv = getCsvContent();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `${ticket?.title || "ticket"}-${ticket?.id || "ticket"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printTicket = () => {
    const createdDateText = ticket?.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : "";
    const assignedLabel = ticket?.assignedToName
      ? ticket.assignedToName
      : ticket?.assignedToEmail
      ? ticket.assignedToEmail
      : "Unassigned";

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Print Ticket</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 16px; }
            p { margin: 8px 0; line-height: 1.5; }
            .label { font-weight: 700; }
            .value { margin-left: 4px; }
          </style>
        </head>
        <body>
          <h1>Ticket ${ticket?.id || ""}</h1>
          <p><span class="label">Title:</span><span class="value">${title || ""}</span></p>
          <p><span class="label">Status:</span><span class="value">${status || ""}</span></p>
          <p><span class="label">Priority:</span><span class="value">${priority || ""}</span></p>
          <p><span class="label">Created By:</span><span class="value">${ticket?.createdByEmail || ticket?.createdBy || ""}</span></p>
          <p><span class="label">Assigned To:</span><span class="value">${assignedLabel}</span></p>
          <p><span class="label">Created:</span><span class="value">${createdDateText}</span></p>
          <hr style="margin: 20px 0;" />
          <p><span class="label">Description:</span></p>
          <p>${(description || "").replace(/\n/g, "<br />")}</p>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = window.close;
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ================= LOAD USERS =================
  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadUsers();
  }, [isAdmin]);

  // ================= LOAD TICKET =================
  useEffect(() => {
    if (!ticket) return;

    setTitle(ticket.title || "");
    setDescription(ticket.description || "");
    setPriority(ticket.priority || "low");
    setStatus(ticket.status || "pending");
    setAssignedToUid(ticket.assignedToUid || "");
  }, [ticket]);

  if (!open) return null;

  // ================= SAVE =================
  const handleSave = async () => {
    if (!ticket?.id) return;

    setLoading(true);

    try {
      const selectedUser = users.find(
        (u) => u.uid === assignedToUid
      );

      const statusChanged = isAdmin && status !== ticket.status;

      // Update the editable fields. Status is included here too so the
      // ticket document stays in sync even without a separate call.
      await updateTicket(ticket.id, {
        title,
        description,
        priority,
        status,
      });

      if (isAdmin) {
        // Assign / reassign, notifying the new assignee if it changed.
        if (assignedToUid !== ticket.assignedToUid) {
          await assignTicket(
            ticket.id,
            selectedUser?.uid || "",
            selectedUser?.email || "",
            selectedUser?.name || selectedUser?.email || "",
            title,
            description,
            priority,
            status
          );
        }

        // Let the ticket's creator know a review decision was made.
        if (statusChanged) {
          await reviewTicket({ ...ticket, title }, status);
        }
      }

      refresh?.();
      onClose?.();

    } catch (err) {
      console.error(err);
      alert(err.message);

    } finally {
      setLoading(false);
    }
  };

  const border = darkMode ? "border-gray-800" : "border-gray-200";
  const fieldBase = darkMode
    ? "bg-gray-800 border-gray-700 text-white focus:ring-indigo-500"
    : "bg-white border-gray-200 text-gray-900 focus:ring-indigo-500";
  const label = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
    darkMode ? "text-gray-400" : "text-gray-500"
  }`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} ${border}`}
      >
        {/* HEADER */}
        <div className={`flex justify-between items-center p-5 border-b ${border}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <TicketIcon size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none">
                {isAdmin ? "Review Ticket" : "View Ticket"}
              </h2>
              {ticket?.id && (
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  ID: {ticket.id.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              darkMode ? "hover:bg-gray-800 hover:text-red-400" : "hover:bg-gray-100 hover:text-red-500"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className={label}>Title</label>
            <input
              className={`w-full rounded-lg p-3 border text-sm outline-none focus:ring-2 transition ${fieldBase}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ticket Title"
            />
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea
              rows={5}
              className={`w-full rounded-lg p-3 border text-sm outline-none focus:ring-2 transition resize-none ${fieldBase}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
            />
          </div>

          <div>
            <label className={label}>Priority</label>
            <select
              className={`w-full rounded-lg p-3 border text-sm outline-none focus:ring-2 transition ${fieldBase}`}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* STATUS — admin gets review actions, everyone else gets a read-only badge */}
          <div>
            <label className={label}>Status</label>

            {isAdmin ? (
              <div className="grid grid-cols-3 gap-2">
                {REVIEW_ACTIONS.map(({ value, label: btnLabel, icon: Icon, active }) => {
                  const isSelected = status === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-xs font-medium transition ${
                        isSelected
                          ? `${active} border-transparent`
                          : darkMode
                          ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={15} />
                      {btnLabel}
                    </button>
                  );
                })}
              </div>
            ) : (
              <StatusBadge status={status} />
            )}
          </div>

          {isAdmin && (
            <div>
              <label className={label}>Assigned To</label>
              <select
                className={`w-full rounded-lg p-3 border text-sm outline-none focus:ring-2 transition ${fieldBase}`}
                value={assignedToUid}
                onChange={(e) => setAssignedToUid(e.target.value)}
              >
                <option value="">Unassigned</option>

                {users.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`border-t ${border} p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="flex flex-wrap items-center gap-2">
            {isApproved && (
              <>
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                  title="Export approved ticket as CSV"
                >
                  <DownloadCloud size={16} />
                  Export CSV
                </button>

                <button
                  type="button"
                  onClick={printTicket}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-600"
                  title="Print approved ticket"
                >
                  <Printer size={16} />
                  Print Ticket
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}