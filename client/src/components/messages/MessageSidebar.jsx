import { X } from "lucide-react";
import MessageFeed from "./MessageFeed";

export default function MessageSidebar({
  isOpen,
  onClose,
  messages,
  loading,
  isAdmin,
  darkMode,
}) {
  if (!isOpen) return null;

  // Inline styles for the shell (backdrop, panel, z-index, sizing) so this
  // can never render as a solid overlay if Tailwind's content globs happen
  // to miss this folder or a class gets purged. Cosmetic bits below still
  // use Tailwind normally.
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          zIndex: 1000,
        }}
      />

      <aside
        className="shadow-2xl"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 1001,
          height: "100%",
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: darkMode ? "#111827" : "#ffffff",
          color: darkMode ? "#ffffff" : "#111827",
        }}
      >
        <div
          className={`flex items-center justify-between border-b px-4 py-4 ${
            darkMode ? "border-gray-800" : "border-gray-100"
          }`}
        >
          <h2 className="text-base font-semibold">Messages</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close messages"
            className={`rounded-lg p-1.5 transition ${
              darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <MessageFeed messages={messages} loading={loading} isAdmin={isAdmin} darkMode={darkMode} />
        </div>
      </aside>
    </div>
  );
}