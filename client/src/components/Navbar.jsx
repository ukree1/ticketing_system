import { auth } from "../firebase"

export default function Navbar() {
  return (
    <header className="h-16 bg-white border-b shadow-sm flex items-center justify-between px-8">
      <h1 className="text-lg font-semibold text-slate-700">
        Ticketing System
      </h1>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
          {auth.currentUser?.email?.charAt(0).toUpperCase()}
        </div>

        <span className="text-sm text-slate-600">
          {auth.currentUser?.email}
        </span>
      </div>
    </header>
  )
}