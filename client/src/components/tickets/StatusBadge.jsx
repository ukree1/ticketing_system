export default function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    approved: "bg-green-500/10 text-green-600 dark:text-green-400",
    declined: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const dot = {
    pending: "bg-amber-500",
    in_progress: "bg-blue-500",
    approved: "bg-green-500",
    declined: "bg-red-500",
  };

  const labels = {
    pending: "Pending Review",
    in_progress: "In Progress",
    approved: "Approved",
    declined: "Declined",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] || "bg-gray-500/10 text-gray-600 dark:text-gray-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dot[status] || "bg-gray-400"}`}
      />
      {labels[status] || status}
    </span>
  );
}