import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, ShieldCheck } from "lucide-react";
import { auth } from "../../firebase";
import {
  sendTicketMessage,
  listenTicketMessages,
} from "../../services/ticketMessageService";

/**
 * One-way admin -> user chat thread scoped to a single ticket.
 *
 * Visibility rule (enforce with Firestore rules too, this is just UI-level):
 *   - Admins can see and send messages on any ticket.
 *   - Regular users can see the thread ONLY if they are the ticket's creator.
 *   - Regular users can never send a message (view-only).
 *
 * Props:
 *   ticketId       string   required
 *   isAdmin        boolean  required
 *   currentUserUid string   required - auth.currentUser?.uid
 *   ticketOwnerUid string   required - ticket.createdBy
 *   darkMode       boolean  optional, defaults to false
 */
export default function TicketChat({
  ticketId,
  isAdmin,
  currentUserUid,
  ticketOwnerUid,
  darkMode = false,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const canView = isAdmin || currentUserUid === ticketOwnerUid;

  useEffect(() => {
    if (!ticketId || !canView) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenTicketMessages(
      ticketId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      () => {
        setError("Couldn't load messages.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ticketId, canView]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!isAdmin || !draft.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      await sendTicketMessage(
        ticketId,
        {
          uid: auth.currentUser?.uid,
          name: auth.currentUser?.displayName,
          email: auth.currentUser?.email,
        },
        draft
      );
      setDraft("");
    } catch (err) {
      console.error("Send ticket message:", err);
      setError("Message failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!canView) return null;

  return (
    <section
      className={`flex h-[420px] flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ${
        darkMode ? "bg-gray-900 ring-gray-800" : "bg-white ring-gray-100"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b px-5 py-4 ${
          darkMode ? "border-gray-800" : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-500" />
          <h3 className="text-sm font-semibold sm:text-base">Admin Updates</h3>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
          }`}
        >
          <ShieldCheck size={12} />
          {isAdmin ? "Admin view" : "View only"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading && (
          <p className="text-center text-sm opacity-60">Loading messages…</p>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-60">
            <MessageSquare size={28} />
            <p className="text-sm">
              {isAdmin
                ? "No messages yet. Send an update to the requester."
                : "No updates from the admin yet."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="flex justify-start">
            <div
              className={`max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm ${
                darkMode ? "bg-indigo-500/10 text-indigo-100" : "bg-indigo-50 text-gray-900"
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-500">
                <ShieldCheck size={12} />
                {msg.senderName || "Admin"}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {msg.text}
              </p>
              <p className="mt-1 text-right text-[11px] opacity-50">
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Composer — admin only, one-way */}
      {isAdmin ? (
        <form
          onSubmit={handleSend}
          className={`flex items-end gap-2 border-t px-4 py-3 ${
            darkMode ? "border-gray-800" : "border-gray-100"
          }`}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Send an update to the requester…"
            rows={1}
            className={`min-h-[42px] flex-1 resize-none rounded-xl border-0 px-3 py-2.5 text-sm outline-none ring-1 transition focus:ring-2 focus:ring-indigo-500 ${
              darkMode
                ? "bg-gray-800 text-white ring-gray-700 placeholder:text-gray-500"
                : "bg-gray-50 text-gray-900 ring-gray-200 placeholder:text-gray-400"
            }`}
          />

          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div
          className={`border-t px-5 py-3 text-center text-xs opacity-60 ${
            darkMode ? "border-gray-800" : "border-gray-100"
          }`}
        >
          Only the admin can send messages here.
        </div>
      )}

      {error && (
        <p className="px-5 pb-3 text-xs text-red-500">{error}</p>
      )}
    </section>
  );
}