import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { updateUserSettings } from "./userService";

/**
 * One-way (admin -> everyone) announcement channel. Not tied to tickets.
 *
 * Data model:
 *   broadcasts/{id}
 *     text, senderUid, senderName, createdAt
 *
 *   users/{uid}
 *     lastSeenBroadcastAt   timestamp   -- used only to compute the unread badge
 *
 * Firestore rules (sketch — merge into your existing rules file):
 *   match /broadcasts/{id} {
 *     allow read: if request.auth != null;
 *     allow create: if request.auth != null &&
 *       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
 *     allow update, delete: if false;
 *   }
 */

const broadcastsRef = collection(db, "broadcasts");

export const listenBroadcasts = (onData, onError) => {
  const q = query(broadcastsRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error("listenBroadcasts:", err);
      onError?.(err);
    }
  );
};

/** Admin-only. */
export const sendBroadcast = async (sender, text) => {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  await addDoc(broadcastsRef, {
    text: trimmed,
    senderUid: sender.uid,
    senderName: sender.name || sender.email || "Admin",
    createdAt: serverTimestamp(),
  });
};

/** Called when a user opens the announcements feed, to clear their badge. */
export const markBroadcastsSeen = async (uid) => {
  if (!uid) return;

  try {
    await updateUserSettings(uid, { lastSeenBroadcastAt: serverTimestamp() });
  } catch (err) {
    console.error("markBroadcastsSeen:", err);
  }
};