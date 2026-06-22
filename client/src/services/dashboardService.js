import { db } from "../firebase"
import {
  collection,
  onSnapshot
} from "firebase/firestore"

export const listenDashboardStats = (callback) => {
  const ticketsRef = collection(db, "tickets")

  return onSnapshot(ticketsRef, (snapshot) => {
    const tickets = snapshot.docs.map(doc => doc.data())

    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === "open").length,
      inProgress: tickets.filter(t => t.status === "in_progress").length,
      closed: tickets.filter(t => t.status === "closed").length,
    }

    callback(stats)
  })
}