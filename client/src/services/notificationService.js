import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  deleteDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";

import { getAdminUsers } from "./userService";

const notifRef = collection(db, "notifications");

// =======================
// CREATE NOTIFICATION
// =======================
// `meta` accepts any extra ticket snapshot fields you want the notification
// card to render without a second Firestore read, e.g. ticketTitle,
// priority, requesterUid, requesterEmail.
export const createNotification = async ({
  type = "system",
  message,
  ticketId = "",
  targetUid,
  ...meta
}) => {
  if (!targetUid || !message) {
    console.warn("Notification not created: missing targetUid or message.");
    return null;
  }

  try {
    const docRef = await addDoc(notifRef, {
      type,
      message,
      ticketId,
      targetUid,
      read: false,
      createdAt: serverTimestamp(),
      ...meta,
    });

    return docRef.id;
  } catch (error) {
    console.error("Failed to create notification", error);
    throw error;
  }
};

// Semantic alias for notifying a single person (e.g. telling a ticket
// owner their ticket was approved/declined/assigned). Same implementation
// as createNotification, kept separate so call sites read clearly.
export const notifyUser = createNotification;

// =======================
// NOTIFY ALL ADMINS
// =======================
// Fan-out a single notification to every admin account. Used when a
// regular user submits a new ticket so admins know to review it.
export const notifyAdmins = async ({
  type = "system",
  message,
  ticketId = "",
  ...meta
}) => {
  try {
    const admins = await getAdminUsers();

    if (admins.length === 0) {
      console.warn("No admins found to notify.");
      return;
    }

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          type,
          message,
          ticketId,
          targetUid: admin.uid,
          ...meta,
        })
      )
    );
  } catch (error) {
    console.error("Failed to notify admins", error);
  }
};

// =======================
// REALTIME LISTENER
// =======================
export const listenNotifications = (
  uid,
  callback,
  errorCallback = () => {}
) => {
  if (!uid) {
    console.warn("listenNotifications: no UID supplied.");
    return () => {};
  }

  const q = query(notifRef, where("targetUid", "==", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        // Sorted client-side so we don't need a composite Firestore index
        // for (targetUid ==) + (createdAt desc).
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) -
            (a.createdAt?.toMillis?.() || 0)
        )
        // Safety cap: keeps the sidebar snappy for accounts that
        // accumulate a lot of history. Bump or remove once old
        // notifications are archived/pruned server-side.
        .slice(0, 100);

      callback(notifications);
    },
    (error) => {
      console.error("Notification listener error:", error.code, error.message);
      errorCallback(error);
    }
  );
};

// =======================
// MARK AS READ
// =======================
export const markNotificationAsRead = async (id) => {
  if (!id) return;

  try {
    await updateDoc(doc(db, "notifications", id), {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to mark as read:", error);
  }
};

// =======================
// MARK ALL AS READ
// =======================
export const markAllNotificationsAsRead = async (uid) => {
  if (!uid) return;

  try {
    const q = query(
      notifRef,
      where("targetUid", "==", uid),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true, readAt: serverTimestamp() });
    });

    await batch.commit();
  } catch (error) {
    console.error("Failed to mark all as read:", error);
  }
};

// =======================
// DELETE NOTIFICATION
// =======================
export const deleteNotification = async (id) => {
  if (!id) return;

  try {
    await deleteDoc(doc(db, "notifications", id));
  } catch (error) {
    console.error("Failed to delete notification:", error);
  }
};