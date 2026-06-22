import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { registerUser } from "../auth/authService"
import { createUserProfile } from "../services/userService"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleRegister = async () => {
    try {
      const cleanEmail = email.trim()

      if (!cleanEmail || !password) {
        alert("Fill all fields")
        return
      }

      setLoading(true)

      const result = await registerUser(cleanEmail, password)

      await createUserProfile(result.user)

      alert("Registered successfully")
      navigate("/")
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-3">
      <h1 className="text-2xl">Register</h1>

      <input
        className="p-2 text-black"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="p-2 text-black"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className={`px-4 py-2 ${
          loading ? "bg-gray-500" : "bg-green-500"
        }`}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "Creating..." : "Register"}
      </button>
    </div>
  )
}