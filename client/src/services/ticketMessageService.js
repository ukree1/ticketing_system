import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Per-ticket, one-way (admin -> user) message thread.
 * Stored at: tickets/{ticketId}/messages/{messageId}
 *
 * Firestore security rules should enforce:
 *  - create: only allowed when request.auth.token role == "admin"
 *  - read: allowed only if requester is an admin OR requester.uid == ticket.createdBy
 *
 * Example rule sketch (adjust to your existing rules structure):
 *
 * match /tickets/{ticketId} {
 *   match /messages/{messageId} {
 *     allow read: if request.auth != null &&
 *       (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin" ||
 *        request.auth.uid == get(/databases/$(database)/documents/tickets/$(ticketId)).data.createdBy);
 *     allow create: if request.auth != null &&
 *       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
 *     allow update, delete: if false;
 *   }
 * }
 */

const messagesCollection = (ticketId) =>
  collection(db, "tickets", ticketId, "messages");

/**
 * Admin-only. Sends a one-way message to the ticket's owner.
 */
export const sendTicketMessage = async (ticketId, sender, text) => {
  const trimmed = (text || "").trim();
  if (!ticketId || !trimmed) return;

  await addDoc(messagesCollection(ticketId), {
    text: trimmed,
    senderUid: sender.uid,
    senderName: sender.name || sender.email || "Admin",
    createdAt: serverTimestamp(),
  });
};

/**
 * Realtime listener for a ticket's message thread, oldest first.
 * Returns an unsubscribe function.
 */
export const listenTicketMessages = (ticketId, onMessages, onError) => {
  if (!ticketId) return () => {};

  const q = query(messagesCollection(ticketId), orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onMessages(messages);
    },
    (err) => {
      console.error("listenTicketMessages:", err);
      if (onError) onError(err);
    }
  );
};