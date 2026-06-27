import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../auth/authService";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      const cleanEmail = email.trim();

      if (!cleanEmail || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }

      setLoading(true);

      await registerUser(cleanEmail, password);

      alert("Account created successfully!");

      navigate("/login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-700 to-cyan-500 flex items-center justify-center p-6">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8">

        <div className="text-center mb-8">

          <div className="mx-auto w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-lg">
            👤
          </div>

          <h1 className="text-3xl font-bold text-white mt-5">
            Create Account
          </h1>

          <p className="text-blue-100 mt-2">
            Register to continue
          </p>

        </div>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/20 px-4 py-3 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-cyan-300"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/20 px-4 py-3 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-cyan-300"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/20 px-4 py-3 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-cyan-300"
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-full rounded-xl py-3 font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </div>

        <div className="mt-8 border-t border-white/20 pt-6">

          <p className="text-center text-blue-100">
            Already have an account?
          </p>

          <button
            onClick={() => navigate("/login")}
            className="mt-3 w-full rounded-xl border border-white/30 py-3 text-white hover:bg-white/10 transition"
          >
            Back to Login
          </button>

        </div>

      </div>

    </div>
  );
}