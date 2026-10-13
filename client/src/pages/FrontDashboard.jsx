import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------
   CONFIG — change these to match your existing routes / services
------------------------------------------------------------------- */
const LOGIN_ROUTE = "/login";
const SUBMIT_TICKET_ROUTE = null; // e.g. "/tickets" — null hides the button
const CONTACT_ENDPOINT = null; // your backend / email service URL. null = not connected
const CONTACT_INFO = null; // e.g. { email: "...", phone: "...", location: "..." }

const NAV = [
  ["Home", "home"],
  ["About", "about"],
  ["Features", "features"],
  ["Support", "support"],
  ["Contact", "contact"],
];

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const Icon = ({ d, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const I = {
  submit: ["M4 5h16v14H4z", "M12 9v6", "M9 12h6"],
  track: ["M3 12h4l3-8 4 16 3-8h4"],
  manage: ["M4 6h16", "M4 12h16", "M4 18h10"],
  assign: ["M16 11a4 4 0 1 0-8 0", "M4 21a8 8 0 0 1 16 0"],
  flag: ["M5 21V4", "M5 4h12l-2 4 2 4H5"],
  archive: ["M3 5h18v4H3z", "M5 9v10h14V9", "M10 13h4"],
  chat: ["M4 5h16v11H9l-5 4z"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2", "M12 20v2", "M2 12h2", "M20 12h2", "M4.9 4.9l1.4 1.4", "M17.7 17.7l1.4 1.4", "M4.9 19.1l1.4-1.4", "M17.7 6.3l1.4-1.4"],
  moon: ["M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"],
  check: ["M5 12.5l4.5 4.5L19 7"],
};

const WHAT = [
  ["Submit Tickets", "Users can report technical issues, request assistance, and provide details about their concerns.", I.submit],
  ["Track Progress", "Users can monitor ticket statuses and see whether their requests are open, in progress, or resolved.", I.track],
  ["Manage Support Requests", "Support personnel can organize, prioritize, and handle tickets more efficiently.", I.manage],
];

// NOTE: only keep items your app really supports.
const FEATURES = [
  ["Easy Ticket Submission", "Describe an issue or request in a simple form.", I.submit],
  ["Ticket Status Tracking", "Follow each request from open to resolved.", I.track],
  ["Assignment and Management", "Assign tickets and keep them organized.", I.assign],
  ["Priority-Based Handling", "Focus on the most urgent issues first.", I.flag],
  ["Organized Support Records", "Keep every request stored in one place.", I.archive],
  ["User–Support Communication", "Keep users and support staff on the same page.", I.chat],
];

const STEPS = [
  ["Submit a Ticket", "Describe the issue or request that needs assistance."],
  ["Track the Ticket", "Follow the progress of the submitted request."],
  ["Get a Resolution", "The support team works on the issue and updates its status."],
];

const FAQ = [
  ["How do I submit a ticket?", "Log in to your account, then create a new ticket and describe your issue or request."],
  ["How do I check my ticket status?", "After logging in, open your tickets to see whether each one is open, in progress, or resolved."],
  ["How do I contact support?", "Use the contact form on this page, or submit a ticket from your account."],
];

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("ze-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* storage unavailable */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/* ------------------------------------------------------------------ */
export default function FrontDashboard() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("ze-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const go = (id) => { setMenuOpen(false); scrollTo(id); };
  const dark = theme === "dark";

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.subject.trim()) e.subject = "Enter a subject.";
    if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters.";
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setStatus(null);
    if (Object.keys(e).length) return;

    if (!CONTACT_ENDPOINT) {
      setStatus({ type: "info", text: "Your message was not sent. Message delivery requires backend integration, which is not connected yet." });
      return;
    }
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus({ type: "ok", text: "Message sent. We will get back to you soon." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus({ type: "error", text: "Message could not be sent. Please try again later." });
    }
  };

  const set = (k) => (ev) => setForm({ ...form, [k]: ev.target.value });

  return (
    <div className="ze" data-theme={theme}>
      <style>{css}</style>

      {/* NAV */}
      <header className="ze-nav">
        <div className="ze-wrap ze-nav-in">
          <button className="ze-brand" onClick={() => go("home")} aria-label="Fabre Ticketing System home">
            <span className="ze-logo">FB</span>
            <span>Fabre Ticketing System</span>
          </button>
          <nav className={`ze-links ${menuOpen ? "open" : ""}`} aria-label="Main">
            {NAV.map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>
            ))}
            <button className="ze-btn ze-btn-primary ze-nav-login" onClick={() => navigate(LOGIN_ROUTE)}>Login</button>
          </nav>
          <div className="ze-tools">
            <button className="ze-icon-btn" onClick={() => setTheme(dark ? "light" : "dark")}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon d={dark ? I.sun : I.moon} size={19} />
            </button>
            <button className="ze-icon-btn ze-burger" onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu" aria-expanded={menuOpen}>
              <Icon d={menuOpen ? I.close : I.menu} size={19} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="ze-hero">
        <div className="ze-wrap ze-hero-in">
          <div className="ze-hero-copy">
            <h1>Welcome to Fabre Ticketing System</h1>
            <p className="ze-sub">Your centralized platform for managing support requests, tracking issues, and delivering better IT support.</p>
            <p className="ze-muted">Fabre helps users submit support tickets, monitor their progress, and communicate with the support team in one convenient platform.</p>
            <div className="ze-actions">
              <button className="ze-btn ze-btn-primary" onClick={() => navigate(LOGIN_ROUTE)}>Get Started</button>
              <button className="ze-btn ze-btn-ghost" onClick={() => go("about")}>Learn More</button>
            </div>
          </div>
          <TicketMockup />
        </div>
      </section>

      {/* WHAT IS */}
      <section className="ze-sec">
        <div className="ze-wrap ze-split">
          <div className="ze-sticky">
            <h2>What Is a Ticketing System?</h2>
            <p className="ze-muted big">A ticketing system is a platform used to organize, manage, and track support requests. Each reported issue is recorded as a ticket, allowing the support team to monitor its status, assign tasks, and work toward a resolution.</p>
          </div>
          <ul className="ze-rows">
            {WHAT.map(([t, d, ic]) => (
              <li key={t}>
                <span className="ze-ic"><Icon d={ic} /></span>
                <div><h3>{t}</h3><p>{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="ze-sec ze-band">
        <div className="ze-wrap">
          <h2 className="ze-h2-left">Everything You Need in One Place</h2>
          <div className="ze-feats">
            {FEATURES.map(([t, d, ic]) => (
              <article key={t}>
                <Icon d={ic} size={24} />
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="ze-sec">
        <div className="ze-wrap ze-split ze-center">
          <div>
            <h2>About Fabre Ticketing System</h2>
            <p className="ze-muted big">Fabre Ticketing System is designed to simplify the process of reporting, organizing, and resolving technical issues. It provides a centralized platform where users can submit support requests and follow their progress, while support personnel can manage and respond to concerns more efficiently.</p>
          </div>
          <Flow />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="ze-sec ze-band">
        <div className="ze-wrap">
          <h2 className="ze-h2-left">How It Works</h2>
          <ol className="ze-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="ze-num">{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SUPPORT */}
      <section id="support" className="ze-sec">
        <div className="ze-wrap ze-split">
          <div className="ze-sticky">
            <h2>Need Help? We're Here for You.</h2>
            <p className="ze-muted big">Having trouble using the system or managing a ticket? Visit our support section to learn how to get assistance.</p>
            <p className="ze-muted">If you need technical help, log in and submit a ticket, or send us a message using the contact form below.</p>
            <div className="ze-actions">
              {SUBMIT_TICKET_ROUTE && (
                <button className="ze-btn ze-btn-primary" onClick={() => navigate(SUBMIT_TICKET_ROUTE)}>Submit a Ticket</button>
              )}
              <button className="ze-btn ze-btn-ghost" onClick={() => go("contact")}>Contact Us</button>
            </div>
          </div>
          <div className="ze-faq">
            {FAQ.map(([q, a], i) => (
              <div className={`ze-faq-item ${openFaq === i ? "open" : ""}`} key={q}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  {q}<span aria-hidden="true">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="ze-sec ze-band">
        <div className="ze-wrap ze-split">
          <div className="ze-sticky">
            <h2>Get in Touch</h2>
            <p className="ze-muted big">Have a question or need assistance? Contact our support team for help with your concerns.</p>
            {CONTACT_INFO && (
              <ul className="ze-info">
                {CONTACT_INFO.email && <li>{CONTACT_INFO.email}</li>}
                {CONTACT_INFO.phone && <li>{CONTACT_INFO.phone}</li>}
                {CONTACT_INFO.location && <li>{CONTACT_INFO.location}</li>}
              </ul>
            )}
          </div>
          <form className="ze-form" onSubmit={onSubmit} noValidate>
            {[["name", "Name", "text"], ["email", "Email", "email"], ["subject", "Subject", "text"]].map(([k, label, type]) => (
              <div className="ze-field" key={k}>
                <label htmlFor={`ze-${k}`}>{label}</label>
                <input id={`ze-${k}`} type={type} value={form[k]} onChange={set(k)}
                  aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `ze-${k}-e` : undefined} />
                {errors[k] && <span className="ze-err" id={`ze-${k}-e`}>{errors[k]}</span>}
              </div>
            ))}
            <div className="ze-field">
              <label htmlFor="ze-message">Message</label>
              <textarea id="ze-message" rows={5} value={form.message} onChange={set("message")}
                aria-invalid={!!errors.message} aria-describedby={errors.message ? "ze-message-e" : undefined} />
              {errors.message && <span className="ze-err" id="ze-message-e">{errors.message}</span>}
            </div>
            {status && <div className={`ze-status ${status.type}`} role="status">{status.text}</div>}
            <button type="submit" className="ze-btn ze-btn-primary">Send Message</button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ze-footer">
        <div className="ze-wrap ze-foot-in">
          <div>
            <div className="ze-brand static"><span className="ze-logo">FB</span><span>Fabre Ticketing System</span></div>
            <p>A centralized platform for submitting, tracking, and managing support requests.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              {NAV.map(([label, id]) => (
                <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a></li>
              ))}
            </ul>
          </div>
          {CONTACT_INFO && (
            <div>
              <h4>Contact</h4>
              <ul>
                {CONTACT_INFO.email && <li>{CONTACT_INFO.email}</li>}
                {CONTACT_INFO.phone && <li>{CONTACT_INFO.phone}</li>}
                {CONTACT_INFO.location && <li>{CONTACT_INFO.location}</li>}
              </ul>
            </div>
          )}
        </div>
        <div className="ze-wrap ze-copy">© {new Date().getFullYear()} Fabre Ticketing System. All rights reserved.</div>
      </footer>
    </div>
  );
}

/* ---------- Hero visual: an illustrative ticket (not live data) ---------- */
function TicketMockup() {
  const steps = [["Open", "done"], ["In progress", "now"], ["Resolved", ""]];
  return (
    <div className="ze-mock" role="img" aria-label="Illustration of a support ticket moving from open to in progress to resolved, with a short conversation between a user and the support team">
      <div className="m-top">
        <div>
          <p className="m-title">Printer on the second floor is offline</p>
          <p className="m-meta">High priority</p>
        </div>
        <span className="m-pill">In progress</span>
      </div>
      <ol className="m-steps">
        {steps.map(([label, state]) => (
          <li key={label} className={state}>
            <span className="m-dot">{state === "done" && <Icon d={I.check} size={12} />}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="m-thread">
        <p className="m-msg user">It has shown offline since this morning.</p>
        <p className="m-msg staff">Thanks for reporting this. We're checking the connection now.</p>
      </div>
    </div>
  );
}

/* ---------- About visual: how a request travels ---------- */
function Flow() {
  return (
    <div className="ze-flow" role="img" aria-label="Users submit a ticket that the support team receives and resolves">
      <div className="f-node"><Icon d={I.assign} size={26} /><span>Users</span></div>
      <div className="f-line" />
      <div className="f-node main"><Icon d={I.submit} size={26} /><span>Ticket</span></div>
      <div className="f-line" />
      <div className="f-node"><Icon d={I.chat} size={26} /><span>Support team</span></div>
    </div>
  );
}

/* ---------- styles (scoped under .ze) ---------- */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&display=swap');

.ze{--bg:#fff;--band:#f6f2ff;--card:#fff;--ink:#15102b;--mut:#5d5778;--line:#e4dcf7;--p:#6d28d9;--p-h:#5b21b6;--on-p:#fff;--soft:#efe8ff;--foot:#1a0f3c;
  --st-bg:#ede9fe;--st-fg:#5b21b6;--ok:#16a34a;
  --display:"Bricolage Grotesque","Instrument Sans",system-ui,sans-serif;--body:"Instrument Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
  font-family:var(--body);color:var(--ink);background:var(--bg);line-height:1.65;font-size:1rem;transition:background .25s,color .25s}
.ze[data-theme="dark"]{--bg:#0c0914;--band:#120d1f;--card:#171127;--ink:#f3effd;--mut:#aaa3c4;--line:#292040;--p:#a78bfa;--p-h:#c4b5fd;--on-p:#150a30;--soft:#231a3d;--foot:#07050d;
  --st-bg:#2e1f55;--st-fg:#d4c8ff;--ok:#4ade80}
html{scroll-behavior:smooth}
.ze *{box-sizing:border-box}
.ze h1,.ze h2,.ze h3,.ze h4{margin:0;font-family:var(--display);letter-spacing:-.025em;line-height:1.1}
.ze p{margin:0}
.ze-wrap{max-width:1160px;margin:0 auto;padding:0 28px}
.ze-sec{padding:112px 0;scroll-margin-top:68px}
.ze-band{background:var(--band)}
.ze-sec h2{font-size:clamp(1.9rem,3.4vw,2.7rem);font-weight:700;margin-bottom:18px}
.ze-h2-left{margin-bottom:48px!important}
.ze-muted{color:var(--mut)}
.ze-muted.big{font-size:1.1rem;margin-bottom:14px;max-width:56ch}

/* nav */
.ze-nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.ze-nav-in{display:flex;align-items:center;gap:16px;height:68px}
.ze-brand{display:flex;align-items:center;gap:10px;background:none;border:0;cursor:pointer;font-family:var(--display);font-weight:700;font-size:1.08rem;letter-spacing:-.01em;color:var(--ink);padding:0}
.ze-brand.static{cursor:default;color:#fff;margin-bottom:14px}
.ze-logo{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--p);color:var(--on-p);font-family:var(--display);font-weight:700;font-size:.86rem}
.ze-links{display:flex;align-items:center;gap:30px;margin-left:auto}
.ze-links a{color:var(--mut);text-decoration:none;font-weight:500;font-size:.95rem;transition:color .15s}
.ze-links a:hover{color:var(--ink)}
.ze-tools{display:flex;gap:8px}
.ze-icon-btn{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;transition:background .15s}
.ze-icon-btn:hover{background:var(--soft)}
.ze-burger{display:none}

/* buttons */
.ze-btn{font:inherit;font-weight:600;font-size:.95rem;padding:13px 26px;border-radius:999px;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s,transform .15s}
.ze-btn-primary{background:var(--p);color:var(--on-p)}
.ze-btn-primary:hover{background:var(--p-h)}
.ze-btn-ghost{background:transparent;color:var(--ink);border-color:var(--line)}
.ze-btn-ghost:hover{background:var(--soft);border-color:var(--p)}
.ze-nav-login{padding:9px 22px}
.ze a:focus-visible,.ze button:focus-visible,.ze input:focus-visible,.ze textarea:focus-visible{outline:3px solid var(--p);outline-offset:3px}

/* hero */
.ze-hero{padding:88px 0 112px;scroll-margin-top:68px}
.ze-hero-in{display:grid;grid-template-columns:1.1fr .9fr;gap:64px;align-items:center}
.ze-hero h1{font-size:clamp(2.5rem,5.6vw,4.2rem);font-weight:700;letter-spacing:-.04em;line-height:1.02;margin-bottom:24px;max-width:13ch}
.ze-sub{font-size:1.2rem;color:var(--ink);margin-bottom:14px;max-width:46ch}
.ze-hero .ze-muted{max-width:50ch}
.ze-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}
.ze-hero-copy>*{animation:ze-rise .6s cubic-bezier(.2,.7,.2,1) both}
.ze-hero-copy>:nth-child(2){animation-delay:.08s}.ze-hero-copy>:nth-child(3){animation-delay:.16s}.ze-hero-copy>:nth-child(4){animation-delay:.24s}
.ze-mock{animation:ze-rise .7s .2s cubic-bezier(.2,.7,.2,1) both}
@keyframes ze-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

/* hero ticket illustration */
.ze-mock{background:var(--card);border:1px solid var(--line);border-radius:28px;padding:28px;box-shadow:0 30px 60px -30px color-mix(in srgb,var(--p) 55%,transparent);position:relative}
.ze-mock::before{content:"";position:absolute;inset:18px -18px -18px 18px;border-radius:28px;background:var(--soft);z-index:-1}
.m-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.m-title{font-family:var(--display);font-weight:700;font-size:1.15rem;letter-spacing:-.02em;line-height:1.25}
.m-meta{color:var(--mut);font-size:.88rem;margin-top:4px}
.m-pill{flex:none;background:var(--st-bg);color:var(--st-fg);font-size:.8rem;font-weight:600;padding:5px 12px;border-radius:999px}
.m-steps{list-style:none;margin:26px 0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.m-steps li{position:relative;display:flex;flex-direction:column;gap:8px;font-size:.82rem;font-weight:500;color:var(--mut)}
.m-steps li::before{content:"";position:absolute;top:10px;left:24px;right:-8px;height:2px;background:var(--line)}
.m-steps li:last-child::before{display:none}
.m-steps li.done::before{background:var(--p)}
.m-dot{position:relative;z-index:1;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;border:2px solid var(--line);background:var(--card);color:var(--on-p)}
.m-steps li.done .m-dot{background:var(--p);border-color:var(--p)}
.m-steps li.now .m-dot{border-color:var(--p);box-shadow:0 0 0 4px var(--soft)}
.m-steps li.now,.m-steps li.done{color:var(--ink)}
.m-thread{display:grid;gap:10px}
.m-msg{font-size:.9rem;padding:11px 15px;border-radius:16px;max-width:86%;line-height:1.5}
.m-msg.user{background:var(--soft);border-bottom-left-radius:5px}
.m-msg.staff{background:var(--p);color:var(--on-p);justify-self:end;border-bottom-right-radius:5px}

/* layouts */
.ze-split{display:grid;grid-template-columns:.9fr 1.1fr;gap:80px;align-items:start}
.ze-split.ze-center{align-items:center}
.ze-sticky{position:sticky;top:112px}

/* what is — list rows */
.ze-rows{list-style:none;margin:0;padding:0}
.ze-rows li{display:flex;gap:20px;padding:30px 0;border-top:1px solid var(--line)}
.ze-rows li:last-child{border-bottom:1px solid var(--line)}
.ze-ic{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:var(--soft);color:var(--p)}
.ze-rows h3{font-size:1.25rem;font-weight:700;margin-bottom:6px}
.ze-rows p{color:var(--mut)}

/* features */
.ze-feats{display:grid;grid-template-columns:repeat(3,1fr);gap:0 48px}
.ze-feats article{padding:28px 0 36px;border-top:1px solid var(--line);color:var(--p)}
.ze-feats h3{font-size:1.15rem;font-weight:700;color:var(--ink);margin:18px 0 8px}
.ze-feats p{color:var(--mut);font-size:.97rem}

/* about flow */
.ze-flow{display:flex;align-items:center;justify-content:center;padding:40px 24px;background:var(--band);border:1px solid var(--line);border-radius:28px}
.f-node{display:flex;flex-direction:column;align-items:center;gap:10px;font-weight:600;font-size:.9rem;color:var(--p);text-align:center}
.f-node svg{box-sizing:content-box;padding:16px;border-radius:50%;background:var(--card);border:1px solid var(--line)}
.f-node span{color:var(--ink)}
.f-node.main svg{background:var(--p);color:var(--on-p);border-color:var(--p)}
.f-line{flex:1;min-width:24px;max-width:72px;height:2px;margin:0 6px 30px;background:repeating-linear-gradient(90deg,var(--p) 0 6px,transparent 6px 12px);opacity:.5}

/* steps */
.ze-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.ze-steps li{position:relative;padding-top:68px}
.ze-steps li::before{content:"";position:absolute;top:21px;left:52px;right:-40px;height:2px;background:var(--line)}
.ze-steps li:last-child::before{display:none}
.ze-num{position:absolute;top:0;left:0;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--p);color:var(--on-p);font-family:var(--display);font-weight:700}
.ze-steps h3{font-size:1.25rem;font-weight:700;margin-bottom:8px}
.ze-steps p{color:var(--mut);max-width:32ch}

/* faq */
.ze-faq{border-top:1px solid var(--line)}
.ze-faq-item{border-bottom:1px solid var(--line)}
.ze-faq-item button{width:100%;display:flex;justify-content:space-between;gap:16px;align-items:center;text-align:left;font-family:var(--display);font-size:1.12rem;font-weight:700;letter-spacing:-.015em;background:none;border:0;padding:24px 0;cursor:pointer;color:var(--ink)}
.ze-faq-item button span{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:50%;background:var(--soft);color:var(--p);font-size:1.15rem;line-height:1}
.ze-faq-item p{padding:0 48px 26px 0;color:var(--mut)}

/* contact */
.ze-info{list-style:none;margin:22px 0 0;padding:0;color:var(--mut);display:grid;gap:6px}
.ze-form{background:var(--card);border:1px solid var(--line);border-radius:28px;padding:36px;display:grid;gap:18px}
.ze-field{display:grid;gap:7px}
.ze-field label{font-weight:600;font-size:.9rem}
.ze-field input,.ze-field textarea{font:inherit;padding:13px 16px;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--ink);resize:vertical;transition:border-color .15s}
.ze-field input:hover,.ze-field textarea:hover{border-color:var(--p)}
.ze-field input[aria-invalid="true"],.ze-field textarea[aria-invalid="true"]{border-color:#ef4444}
.ze-err{color:#ef4444;font-size:.85rem}
.ze-status{padding:13px 16px;border-radius:14px;font-size:.92rem;background:var(--soft);color:var(--ink)}
.ze-status.ok{background:#dcfce7;color:#166534}
.ze-status.error{background:#fee2e2;color:#991b1b}
.ze-form .ze-btn{justify-self:start}

/* footer */
.ze-footer{background:var(--foot);color:#cfc8e6;padding:72px 0 28px}
.ze-foot-in{display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px}
.ze-footer .ze-logo{background:#a78bfa;color:#150a30}
.ze-footer h4{color:#fff;margin-bottom:14px;font-size:1rem}
.ze-footer ul{list-style:none;margin:0;padding:0;display:grid;gap:9px;font-size:.95rem}
.ze-footer a{color:#cfc8e6;text-decoration:none}
.ze-footer a:hover{color:#fff}
.ze-footer p{font-size:.95rem;max-width:36ch}
.ze-copy{margin-top:56px;padding-top:22px;border-top:1px solid rgba(255,255,255,.1);font-size:.88rem;color:#9a92b8}

/* responsive */
@media (max-width:960px){
  .ze-hero-in,.ze-split{grid-template-columns:1fr;gap:56px}
  .ze-sticky{position:static}
  .ze-mock::before{inset:14px -8px -14px 8px}
  .ze-feats{grid-template-columns:1fr 1fr}
  .ze-foot-in{grid-template-columns:1fr 1fr}
}
@media (max-width:720px){
  .ze-burger{display:grid}
  .ze-links{position:absolute;top:68px;left:0;right:0;margin:0;background:var(--bg);border-bottom:1px solid var(--line);flex-direction:column;align-items:stretch;gap:0;padding:6px 28px 22px;display:none}
  .ze-links.open{display:flex}
  .ze-links a{padding:15px 0;border-bottom:1px solid var(--line)}
  .ze-nav-login{margin-top:16px}
  .ze-brand span:last-child{font-size:1rem}
  .ze-tools{margin-left:auto}
  .ze-sec{padding:72px 0}
  .ze-hero{padding:48px 0 72px}
  .ze-hero h1{max-width:none}
  .ze-feats{grid-template-columns:1fr}
  .ze-steps{grid-template-columns:1fr;gap:0}
  .ze-steps li{padding:0 0 36px 64px;min-height:44px}
  .ze-steps li::before{top:44px;bottom:0;left:21px;right:auto;width:2px;height:auto}
  .ze-form{padding:24px}
  .ze-foot-in{grid-template-columns:1fr}
  .ze-flow{padding:28px 12px}
}
@media (prefers-reduced-motion:reduce){
  .ze *{animation:none!important;transition:none!important}
  html{scroll-behavior:auto}
}
`;