import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        <main className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}