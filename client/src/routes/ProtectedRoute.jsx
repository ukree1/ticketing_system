import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { auth } from "../firebase"
import { getUserRole } from "../services/userService"

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u)

      if (u) {
        const userRole = await getUserRole(u.uid)
        setRole(userRole)
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // 🔥 ROLE CHECK
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" />
  }

  return children
}