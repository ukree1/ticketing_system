import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar />

      {/* ml-64 must only apply at lg+, since the fixed sidebar itself
          only renders at lg+ (it's `hidden lg:block` in Sidebar.jsx).
          On mobile there's no left sidebar taking up space, so no
          margin should be reserved for it there. */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <Navbar />

        <main className="p-4 pb-24 sm:p-6 md:p-8 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}