import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";

import { getUserRole } from "./userService";
import { notifyAdmins, createNotification } from "./notificationService";

const colRef = collection(db, "tickets");

// Manual switch — flip to true only when you need to trace ticket
// flow locally. Leave false to keep the console clean.
const DEBUG_TICKETS = false;

const debugLog = (...args) => {
  if (DEBUG_TICKETS) console.log(...args);
};

// =======================
// CREATE TICKET
// =======================
export const createTicket = async (data) => {
  const { auth } = await import("../firebase");
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user");
  }

  try {
    debugLog("========== CREATE TICKET ==========");
    debugLog("Created By:", user.uid);

    const creatorRole = await getUserRole(user.uid);

    const docRef = await addDoc(colRef, {
      title: data.title,
      description: data.description,
      priority: data.priority || "low",
      status: "pending",

      createdBy: user.uid,
      createdByEmail: user.email,

      assignedToUid: data.assignedToUid || "",
      assignedToEmail: data.assignedToEmail || "",
      assignedToName: data.assignedToName || "",

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    debugLog("✅ Ticket Created:", docRef.id);

    if (data.assignedToUid) {
      await createNotification({
        type: "ticket_assigned",
        message: `You have been assigned a new ticket: ${data.title}`,
        ticketId: docRef.id,
        ticketTitle: data.title,
        priority: data.priority || "low",
        targetUid: data.assignedToUid,
      });
      debugLog("✅ Assignment notification created.");
    }

    if (creatorRole !== "admin") {
      await notifyAdmins({
        type: "ticket_created",
        message: `${user.email} submitted a new ${data.priority || "low"} priority ticket: "${data.title}"`,
        ticketId: docRef.id,
        ticketTitle: data.title,
        priority: data.priority || "low",
        requesterUid: user.uid,
        requesterEmail: user.email,
      });
      debugLog("✅ Admins notified of new ticket.");
    }

    return docRef;
  } catch (err) {
    console.error("❌ CREATE TICKET FAILED");
    console.error(err);
    throw err;
  }
};

// =======================
// GET ALL TICKETS
// =======================
export const getTickets = async () => {
  try {
    const snap = await getDocs(colRef);

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("getTickets:", err);
    return [];
  }
};

// =======================
// GET SINGLE TICKET
// =======================
export const getTicketById = async (id) => {
  try {
    const snap = await getDoc(doc(db, "tickets", id));

    if (!snap.exists()) {
      throw new Error("Ticket not found");
    }

    return {
      id: snap.id,
      ...snap.data(),
    };
  } catch (err) {
    console.error("getTicketById:", err);
    throw err;
  }
};

// =======================
// REALTIME LISTENER
// =======================
export const listenToTickets = async (callback, user) => {
  if (!user) {
    console.warn("❌ No authenticated user.");
    return () => {};
  }

  debugLog("=================================");
  debugLog("START TICKET LISTENER");
  debugLog("User:", user);

  try {
    const role = await getUserRole(user.uid);

    debugLog("Detected Role:", role);

    let q;

    if (role === "admin") {
      debugLog("Loading ALL tickets");

      q = query(colRef, orderBy("createdAt", "desc"));
    } else {
      debugLog("Loading USER tickets");

      q = query(
        colRef,
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

    return onSnapshot(
      q,

      (snapshot) => {
        debugLog("=================================");
        debugLog("TICKET SNAPSHOT RECEIVED");
        debugLog("Documents:", snapshot.size);

        const tickets = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        callback(tickets);
      },

      (error) => {
        // Real failures stay logged regardless of DEBUG_TICKETS — this
        // is an actual error path, not routine trace output.
        console.error("=================================");
        console.error("🔥 FIRESTORE TICKET LISTENER ERROR");
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        console.error(error);
        console.error("=================================");
      }
    );
  } catch (err) {
    console.error("listenToTickets:", err);
    return () => {};
  }
};

// =======================
// UPDATE TICKET
// =======================
export const updateTicket = async (id, data) => {
  try {
    await updateDoc(doc(db, "tickets", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    debugLog("✅ Ticket updated:", id);
  } catch (err) {
    console.error("updateTicket:", err);
    throw err;
  }
};

// =======================
// UPDATE STATUS
// =======================
export const updateTicketStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "tickets", id), {
      status,
      updatedAt: serverTimestamp(),
    });

    debugLog("✅ Status updated:", id);
  } catch (err) {
    console.error("updateTicketStatus:", err);
    throw err;
  }
};

// =======================
// REVIEW TICKET (admin action)
// =======================
const statusMessages = {
  pending: "set back to pending",
  in_progress: "moved to In Progress",
  approved: "approved",
  declined: "declined",
};

export const reviewTicket = async (ticket, status) => {
  if (!ticket?.id) return;

  try {
    await updateDoc(doc(db, "tickets", ticket.id), {
      status,
      updatedAt: serverTimestamp(),
    });

    debugLog("✅ Ticket reviewed:", ticket.id, status);

    if (ticket.createdBy) {
      await createNotification({
        type: "ticket_status",
        message: `Your ticket "${ticket.title}" was ${
          statusMessages[status] || status
        }.`,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        targetUid: ticket.createdBy,
      });
    }
  } catch (err) {
    console.error("reviewTicket:", err);
    throw err;
  }
};

// =======================
// ASSIGN TICKET
// =======================
export const assignTicket = async (
  ticketId,
  assignedToUid,
  assignedToEmail,
  assignedToName,
  ticketTitle = "",
  ticketDescription = "",
  ticketPriority = "low",
  ticketStatus = "pending"
) => {
  try {
    debugLog("========== ASSIGN TICKET ==========");
    debugLog("Ticket:", ticketId);
    debugLog("Assign UID:", assignedToUid);

    const ref = doc(db, "tickets", ticketId);

    await updateDoc(ref, {
      assignedToUid: assignedToUid || "",
      assignedToEmail: assignedToEmail || "",
      assignedToName: assignedToName || "",
      updatedAt: serverTimestamp(),
    });

    debugLog("✅ Ticket assigned.");

    if (assignedToUid) {
      await createNotification({
        type: "ticket_assigned",
        message: `You have been assigned a new ticket: ${ticketTitle}`,
        ticketId,
        ticketTitle,
        priority: ticketPriority,
        targetUid: assignedToUid,
      });

      debugLog("✅ Notification created.");
    }
  } catch (err) {
    console.error("assignTicket:", err);
    throw err;
  }
};

// =======================
// DELETE TICKET
// =======================
export const deleteTicket = async (id) => {
  try {
    await deleteDoc(doc(db, "tickets", id));
    debugLog("✅ Ticket deleted:", id);
  } catch (err) {
    console.error("deleteTicket:", err);
    throw err;
  }
};