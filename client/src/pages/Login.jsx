import { useState } from "react"
import { loginUser } from "../auth/authService"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      const cleanEmail = email.trim()

      if (!cleanEmail || !password) {
        alert("Fill all fields")
        return
      }

      setLoading(true)

      await loginUser(cleanEmail, password)

      alert("Login success")
      navigate("/dashboard")
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-3">
      <h1 className="text-2xl">Login</h1>

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
          loading ? "bg-gray-500" : "bg-blue-500"
        }`}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  )
}