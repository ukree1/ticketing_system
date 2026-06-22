import { db } from "../firebase"
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore"

import { getUserRole } from "./userService"

const colRef = collection(db, "tickets")

// =======================
// CREATE TICKET (FIXED)
// =======================
export const createTicket = async (data) => {
  const { auth } = await import("../firebase")
  const user = auth.currentUser

  if (!user) throw new Error("No authenticated user")

  return await addDoc(colRef, {
    title: data.title,
    description: data.description,
    priority: data.priority || "low",
    status: "open",

    createdBy: user.uid,
    createdByEmail: user.email,

    assignedTo: "",
    createdAt: serverTimestamp(),
    updatedAt: null
  })
}

// =======================
// GET ALL (OPTIONAL)
// =======================
export const getTickets = async () => {
  const snap = await getDocs(colRef)

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

// =======================
// REALTIME LISTENER (ROLE BASED)
// =======================
export const listenToTickets = async (callback, user) => {
  if (!user) return () => {}

  const role = await getUserRole(user.uid)

  const q = query(colRef, orderBy("createdAt", "desc"))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const allTickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // ADMIN → ALL TICKETS
    if (role === "admin") {
      callback(allTickets)
      return
    }

    // USER → OWN TICKETS ONLY
    const filtered = allTickets.filter(
      (t) => t.createdBy === user.uid
    )

    callback(filtered)
  })

  return unsubscribe
}

// =======================
// UPDATE
// =======================
export const updateTicket = async (id, data) => {
  const ref = doc(db, "tickets", id)

  return await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

// =======================
// STATUS UPDATE
// =======================
export const updateTicketStatus = async (id, status) => {
  const ref = doc(db, "tickets", id)

  return await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp()
  })
}

// =======================
// ASSIGN
// =======================
export const assignTicket = async (id, email) => {
  const ref = doc(db, "tickets", id)

  return await updateDoc(ref, {
    assignedTo: email,
    updatedAt: serverTimestamp()
  })
}

// =======================
// DELETE
// =======================
export const deleteTicket = async (id) => {
  const ref = doc(db, "tickets", id)

  return await deleteDoc(ref)
}