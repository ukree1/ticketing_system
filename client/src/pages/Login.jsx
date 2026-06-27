import { useState } from "react";
import { loginUser } from "../auth/authService";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        alert("Please fill in all fields.");
        return;
      }

      setLoading(true);

      await loginUser(cleanEmail, password);

      navigate("/dashboard");
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
            🎫
          </div>

          <h1 className="text-3xl font-bold text-white mt-5">
            Ticketing System
          </h1>

          <p className="text-blue-100 mt-2">
            Sign in to continue
          </p>
        </div>

        <div className="space-y-5">

          <div>
            <label className="text-white text-sm mb-2 block">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/20 px-4 py-3 text-white placeholder-white/70 outline-none focus:border-white focus:ring-2 focus:ring-cyan-300 transition"
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/20 px-4 py-3 pr-12 text-white placeholder-white/70 outline-none focus:border-white focus:ring-2 focus:ring-cyan-300 transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full rounded-xl py-3 font-semibold transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-white text-blue-700 hover:bg-cyan-100 hover:scale-[1.02]"
            }`}
          >
            {loading ? (
              <div className="flex justify-center items-center gap-2">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6">

  <p className="text-center text-blue-100 text-sm">
    Don't have an account?
  </p>

  <button
    onClick={() => navigate("/register")}
    className="mt-3 w-full rounded-xl border border-white/30 py-3 text-white font-semibold hover:bg-white/10 transition"
  >
    Create Account
  </button>

  <p className="text-center text-blue-200 text-xs mt-5">
    Secure Ticket Management System
  </p>

</div>

      </div>

    </div>
  );
}