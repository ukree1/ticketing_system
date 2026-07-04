import { db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Messenger-style, one-way (admin -> user) messaging, threaded per ticket.
 *
 * Data model:
 *   tickets/{ticketId}                 -- existing ticket doc, extended with:
 *     lastMessageText   string
 *     lastMessageAt     timestamp
 *     lastMessageBy     "admin"
 *     unreadForUser     boolean
 *
 *   tickets/{ticketId}/messages/{id}
 *     text, senderUid, senderName, createdAt
 *
 * Firestore rules (sketch — merge into your existing rules file):
 *   match /tickets/{ticketId} {
 *     allow read: if request.auth != null &&
 *       (isAdmin() || request.auth.uid == resource.data.createdBy);
 *
 *     match /messages/{messageId} {
 *       allow read: if request.auth != null &&
 *         (isAdmin() ||
 *          request.auth.uid == get(/databases/$(database)/documents/tickets/$(ticketId)).data.createdBy);
 *       allow create: if isAdmin();
 *       allow update, delete: if false;
 *     }
 *   }
 *
 * Note: listenConversations() for regular users filters by createdBy + orders
 * by createdAt, which Firestore needs a composite index for. The first time
 * it runs, the console error will contain a direct link to create it.
 */

const ticketsRef = collection(db, "tickets");
const messagesRef = (ticketId) => collection(db, "tickets", ticketId, "messages");

const toMillis = (ts) => ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);

const sortByRecentActivity = (list) =>
  [...list].sort(
    (a, b) => toMillis(b.lastMessageAt || b.createdAt) - toMillis(a.lastMessageAt || a.createdAt)
  );

/**
 * Conversations = tickets. Admins see every ticket; a user sees only the
 * tickets they created.
 */
export const listenConversations = (uid, isAdmin, onData, onError) => {
  const q = isAdmin
    ? query(ticketsRef, orderBy("createdAt", "desc"))
    : query(ticketsRef, where("createdBy", "==", uid), orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snap) => onData(sortByRecentActivity(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    (err) => {
      console.error("listenConversations:", err);
      onError?.(err);
    }
  );
};

export const listenThreadMessages = (ticketId, onData, onError) => {
  if (!ticketId) return () => {};

  const q = query(messagesRef(ticketId), orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error("listenThreadMessages:", err);
      onError?.(err);
    }
  );
};

/** Admin-only. Regular users never call this. */
export const sendMessage = async (ticketId, sender, text) => {
  const trimmed = (text || "").trim();
  if (!ticketId || !trimmed) return;

  await addDoc(messagesRef(ticketId), {
    text: trimmed,
    senderUid: sender.uid,
    senderName: sender.name || sender.email || "Admin",
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "tickets", ticketId), {
    lastMessageText: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: "admin",
    unreadForUser: true,
  });
};

/** Called when the requester opens a thread, to clear their unread flag. */
export const markThreadRead = async (ticketId) => {
  if (!ticketId) return;

  try {
    await updateDoc(doc(db, "tickets", ticketId), { unreadForUser: false });
  } catch (err) {
    console.error("markThreadRead:", err);
  }
};