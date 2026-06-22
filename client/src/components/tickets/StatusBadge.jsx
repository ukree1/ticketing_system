export default function StatusBadge({ status }) {
  const styles = {
    open: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    closed: "bg-green-100 text-green-700",
  }

  const labels = {
    open: "Open",
    in_progress: "In Progress",
    closed: "Closed",
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[status] || status}
    </span>
  )
}