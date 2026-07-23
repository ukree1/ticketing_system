import { db, auth } from "../firebase";
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
import { authFlags } from "../utils/authFlags";

const notifRef = collection(db, "notifications");

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

export const notifyUser = createNotification;

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
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        )
        .slice(0, 100);

      callback(notifications);
    },
    (error) => {
      // Same sign-out race as broadcasts: this listener can still be
      // live for a tick after the auth token is invalidated. Not a
      // real problem — swallow it quietly instead of logging it as one.
      if (
        error.code === "permission-denied" &&
        (authFlags.loggingOut || !auth.currentUser)
      ) {
        return;
      }
      console.error("Notification listener error:", error.code, error.message);
      errorCallback(error);
    }
  );
};

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

export const deleteNotification = async (id) => {
  if (!id) return;

  try {
    await deleteDoc(doc(db, "notifications", id));
  } catch (error) {
    console.error("Failed to delete notification:", error);
  }
};