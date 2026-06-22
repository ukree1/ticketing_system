export default function DashboardCard({ title, value, color }) {
  return (
    <div
      className={`rounded-2xl p-6 text-white shadow-lg transition hover:scale-[1.03] ${color}`}
    >
      <h2 className="text-sm opacity-80">{title}</h2>
      <h1 className="text-4xl font-bold mt-2">{value}</h1>
    </div>
  )
}