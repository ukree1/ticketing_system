import { useTheme } from "../context/ThemeContext";

export default function DashboardCard({ title, value, color }) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-2xl p-6 shadow-lg transition hover:scale-[1.03] ${
        darkMode ? "bg-indigo-600 text-white" : `${color} text-white`
      }`}
    >
      <h2 className="text-sm opacity-80">{title}</h2>
      <h1 className="text-4xl font-bold mt-2">{value}</h1>
    </div>
  );
}