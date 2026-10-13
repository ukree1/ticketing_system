import { useState, useEffect } from "react";
import { loginUser } from "../auth/authService";
import { useNavigate } from "react-router-dom";

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("ze-theme"); // same key as the homepage
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* storage unavailable */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const Icon = ({ d, size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const SUN = ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2", "M12 20v2", "M2 12h2", "M20 12h2", "M4.9 4.9l1.4 1.4", "M17.7 17.7l1.4 1.4", "M4.9 19.1l1.4-1.4", "M17.7 6.3l1.4-1.4"];
const MOON = ["M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"];
const BACK = ["M19 12H5", "M12 19l-7-7 7-7"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);

  const navigate = useNavigate();
  const dark = theme === "dark";

  useEffect(() => {
    try { localStorage.setItem("ze-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const handleBack = () => navigate("/");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await loginUser(cleanEmail, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zl" data-theme={theme}>
      <style>{css}</style>

      {/* Brand panel (desktop) */}
      <aside className="zl-side">
        <div className="zl-brand"><span className="zl-logo">FB</span><span>Fabre Ticketing System</span></div>
        <div>
          <h2>Every request, from open to resolved.</h2>
          <p>Submit tickets, follow their progress, and stay in touch with the support team in one place.</p>
          <ol className="zl-status">
            <li>Open</li>
            <li>In progress</li>
            <li>Resolved</li>
          </ol>
        </div>
        <p className="zl-foot">Secure Ticket Management System</p>
      </aside>

      {/* Form */}
      <main className="zl-main">
        <div className="zl-top">
          <button type="button" className="zl-back" onClick={handleBack}>
            <Icon d={BACK} size={17} /> Back to home
          </button>
          <button type="button" className="zl-icon" onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            <Icon d={dark ? SUN : MOON} />
          </button>
        </div>

        <form className="zl-form" onSubmit={handleLogin} noValidate>
          <div className="zl-brand zl-brand-m"><span className="zl-logo">FB</span><span>Fabre Ticketing System</span></div>

          <h1>Welcome back</h1>
          <p className="zl-lead">Sign in to continue to your account.</p>

          {error && <div className="zl-error" role="alert">{error}</div>}

          <div className="zl-field">
            <label htmlFor="zl-email">Email address</label>
            <input id="zl-email" type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
          </div>

          <div className="zl-field">
            <label htmlFor="zl-password">Password</label>
            <div className="zl-pw">
              <input id="zl-password" type={showPassword ? "text" : "password"} placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="zl-submit" disabled={loading}>
            {loading ? (<><span className="zl-spin" aria-hidden="true" />Logging in...</>) : "Login"}
          </button>

          <p className="zl-note">Need an account? Contact your administrator.</p>
        </form>
      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&display=swap');

.zl{--bg:#fff;--ink:#15102b;--mut:#5d5778;--line:#e4dcf7;--p:#6d28d9;--p-h:#5b21b6;--on-p:#fff;--soft:#efe8ff;
  --display:"Bricolage Grotesque","Instrument Sans",system-ui,sans-serif;--body:"Instrument Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
  min-height:100vh;display:grid;grid-template-columns:minmax(340px,.85fr) 1.15fr;font-family:var(--body);color:var(--ink);background:var(--bg);line-height:1.6;transition:background .25s,color .25s}
.zl[data-theme="dark"]{--bg:#0c0914;--ink:#f3effd;--mut:#aaa3c4;--line:#292040;--p:#a78bfa;--p-h:#c4b5fd;--on-p:#150a30;--soft:#231a3d}
.zl *{box-sizing:border-box}
.zl h1,.zl h2{margin:0;font-family:var(--display);letter-spacing:-.03em;line-height:1.08}
.zl p{margin:0}
.zl button:focus-visible,.zl input:focus-visible{outline:3px solid var(--p);outline-offset:3px}

/* side panel */
.zl-side{background:#1a0f3c;color:#e8e1ff;padding:48px;display:flex;flex-direction:column;justify-content:space-between;gap:48px}
.zl-side h2{font-size:clamp(2rem,3.2vw,2.8rem);font-weight:700;color:#fff;max-width:14ch;margin-bottom:18px}
.zl-side p{color:#c9bff0;max-width:38ch}
.zl-brand{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:700;font-size:1.08rem;letter-spacing:-.01em}
.zl-logo{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#a78bfa;color:#150a30;font-weight:700;font-size:.86rem}
.zl-status{list-style:none;margin:28px 0 0;padding:0;display:flex;gap:10px;flex-wrap:wrap}
.zl-status li{padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2);font-size:.85rem;font-weight:500;color:#e8e1ff}
.zl-status li:nth-child(2){background:rgba(167,139,250,.22);border-color:#a78bfa}
.zl-foot{font-size:.85rem}

/* main */
.zl-main{display:flex;flex-direction:column;padding:24px 32px 40px}
.zl-top{display:flex;justify-content:space-between;align-items:center}
.zl-back{display:inline-flex;align-items:center;gap:8px;font:inherit;font-size:.92rem;font-weight:500;color:var(--mut);background:none;border:0;padding:10px 12px;margin-left:-12px;border-radius:999px;cursor:pointer;transition:color .15s,background .15s}
.zl-back:hover{color:var(--ink);background:var(--soft)}
.zl-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;transition:background .15s}
.zl-icon:hover{background:var(--soft)}
.zl-form{width:100%;max-width:400px;margin:auto;padding:24px 0;display:grid;gap:20px}
.zl-brand-m{display:none;color:var(--ink)}
.zl-brand-m .zl-logo{background:var(--p);color:var(--on-p)}
.zl-form h1{font-size:2.3rem;font-weight:700}
.zl-lead{color:var(--mut);margin-top:-12px}
.zl-error{padding:12px 16px;border-radius:14px;font-size:.92rem;background:#fee2e2;color:#991b1b}
.zl[data-theme="dark"] .zl-error{background:#3b1219;color:#fca5a5}

.zl-field{display:grid;gap:8px}
.zl-field label{font-weight:600;font-size:.9rem}
.zl-field input{width:100%;font:inherit;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--ink);transition:border-color .15s}
.zl-field input::placeholder{color:var(--mut);opacity:.7}
.zl-field input:hover{border-color:var(--p)}
.zl-pw{position:relative}
.zl-pw input{padding-right:76px}
.zl-pw button{position:absolute;right:8px;top:50%;transform:translateY(-50%);font:inherit;font-size:.85rem;font-weight:600;color:var(--p);background:none;border:0;padding:8px 10px;border-radius:8px;cursor:pointer}
.zl-pw button:hover{background:var(--soft)}

.zl-submit{display:flex;justify-content:center;align-items:center;gap:10px;width:100%;font:inherit;font-weight:600;font-size:1rem;padding:15px;border-radius:999px;border:0;background:var(--p);color:var(--on-p);cursor:pointer;transition:background .15s}
.zl-submit:hover:not(:disabled){background:var(--p-h)}
.zl-submit:disabled{opacity:.65;cursor:not-allowed}
.zl-spin{width:18px;height:18px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:zl-spin .7s linear infinite}
@keyframes zl-spin{to{transform:rotate(360deg)}}
.zl-note{text-align:center;color:var(--mut);font-size:.9rem}

@media (max-width:860px){
  .zl{grid-template-columns:1fr}
  .zl-side{display:none}
  .zl-brand-m{display:flex}
  .zl-main{padding:16px 20px 32px}
}
@media (prefers-reduced-motion:reduce){
  .zl *{animation:none!important;transition:none!important}
}
`;