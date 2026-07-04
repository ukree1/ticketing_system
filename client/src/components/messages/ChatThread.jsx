import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { auth } from "../../firebase";
import { listenThreadMessages, sendMessage, markThreadRead } from "../../services/messagingService";

const initials = (text = "") =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const formatTime = (ts) => {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function ChatThread({ conversation, isAdmin, darkMode, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const ticketId = conversation?.id;

  const displayName = isAdmin
    ? conversation?.createdByName || conversation?.createdByEmail || "Requester"
    : "Admin Support";

  useEffect(() => {
    if (!ticketId) return;

    setLoading(true);

    const unsubscribe = listenThreadMessages(
      ticketId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      () => {
        setError("Couldn't load this conversation.");
        setLoading(false);
      }
    );

    if (!isAdmin) markThreadRead(ticketId);

    return () => unsubscribe();
  }, [ticketId, isAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!isAdmin || !draft.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      await sendMessage(
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
      console.error("Send message:", err);
      setError("Message failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-60">
        <MessageCircle size={32} />
        <p className="text-sm">Select a conversation to view messages.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={`flex items-center gap-3 border-b px-4 py-3 ${
          darkMode ? "border-gray-800" : "border-gray-100"
        }`}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className={`rounded-lg p-1.5 transition ${
              darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            darkMode ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-600"
          }`}
        >
          {initials(displayName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs opacity-60">{conversation.title || "Untitled ticket"}</p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
          }`}
        >
          <ShieldCheck size={11} />
          {isAdmin ? "Admin" : "View only"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading && <p className="text-center text-sm opacity-60">Loading messages…</p>}

        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-60">
            <MessageCircle size={26} />
            <p className="text-sm">
              {isAdmin ? "Send the first update to this requester." : "No updates yet."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="flex justify-start">
            <div
              className={`max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm ${
                darkMode ? "bg-indigo-500/10 text-indigo-100" : "bg-indigo-50 text-gray-900"
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-500">
                <ShieldCheck size={12} />
                {msg.senderName || "Admin"}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.text}</p>
              <p className="mt-1 text-right text-[11px] opacity-50">{formatTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Composer — admin only */}
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
            placeholder="Message this requester…"
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
          className={`border-t px-4 py-3 text-center text-xs opacity-60 ${
            darkMode ? "border-gray-800" : "border-gray-100"
          }`}
        >
          Only the admin can send messages here.
        </div>
      )}

      {error && <p className="px-4 pb-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}