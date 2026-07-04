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

// =======================
// CREATE TICKET
// =======================
// Any signed-in user can submit a ticket. New tickets start as "pending"
// so an admin can review them and move them to in_progress / approved /
// declined. If a regular user creates the ticket, every admin gets notified.
export const createTicket = async (data) => {
  const { auth } = await import("../firebase");
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user");
  }

  try {
    console.log("========== CREATE TICKET ==========");
    console.log("Created By:", user.uid);

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

    console.log("✅ Ticket Created:", docRef.id);

    // Notify the assignee directly, if one was set (admin-only action).
    if (data.assignedToUid) {
      await createNotification({
        type: "ticket_assigned",
        message: `You have been assigned a new ticket: ${data.title}`,
        ticketId: docRef.id,
        ticketTitle: data.title,
        priority: data.priority || "low",
        targetUid: data.assignedToUid,
      });
      console.log("✅ Assignment notification created.");
    }

    // Let every admin know a new ticket needs review. The extra fields
    // (ticketTitle, priority, requesterUid/Email) aren't required by
    // Firestore — they just let the notification bell render a rich card
    // and let admin actions (assign/approve/decline) know who to notify
    // back, without a second read.
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
      console.log("✅ Admins notified of new ticket.");
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

  console.log("=================================");
  console.log("START TICKET LISTENER");
  console.log("User:", user);

  try {
    const role = await getUserRole(user.uid);

    console.log("Detected Role:", role);

    let q;

    if (role === "admin") {
      console.log("Loading ALL tickets");

      q = query(colRef, orderBy("createdAt", "desc"));
    } else {
      console.log("Loading USER tickets");

      q = query(
        colRef,
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

    return onSnapshot(
      q,

      (snapshot) => {
        console.log("=================================");
        console.log("TICKET SNAPSHOT RECEIVED");
        console.log("Documents:", snapshot.size);

        const tickets = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        callback(tickets);
      },

      (error) => {
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

    console.log("✅ Ticket updated:", id);
  } catch (err) {
    console.error("updateTicket:", err);
    throw err;
  }
};

// =======================
// UPDATE STATUS
// =======================
// Plain status change with no notification side-effect. Prefer
// reviewTicket() below for admin decisions, since it also lets the
// ticket's creator know what happened.
export const updateTicketStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "tickets", id), {
      status,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Status updated:", id);
  } catch (err) {
    console.error("updateTicketStatus:", err);
    throw err;
  }
};

// =======================
// REVIEW TICKET (admin action)
// =======================
// status: "pending" | "in_progress" | "approved" | "declined"
// Updates the ticket and lets the ticket's creator know a decision was made.
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

    console.log("✅ Ticket reviewed:", ticket.id, status);

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
    console.log("========== ASSIGN TICKET ==========");
    console.log("Ticket:", ticketId);
    console.log("Assign UID:", assignedToUid);

    const ref = doc(db, "tickets", ticketId);

    await updateDoc(ref, {
      assignedToUid: assignedToUid || "",
      assignedToEmail: assignedToEmail || "",
      assignedToName: assignedToName || "",
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Ticket assigned.");

    if (assignedToUid) {
      await createNotification({
        type: "ticket_assigned",
        message: `You have been assigned a new ticket: ${ticketTitle}`,
        ticketId,
        ticketTitle,
        priority: ticketPriority,
        targetUid: assignedToUid,
      });

      console.log("✅ Notification created.");
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
    console.log("✅ Ticket deleted:", id);
  } catch (err) {
    console.error("deleteTicket:", err);
    throw err;
  }
};