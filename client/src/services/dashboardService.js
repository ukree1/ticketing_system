import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { getUserRole } from "./userService";

export const listenDashboardStats = async (uid, callback) => {
  console.log("=================================");
  console.log("DASHBOARD TEST");
  console.log("UID:", uid);
  console.log("=================================");

  const role = await getUserRole(uid);

  let q;

  if (role === "admin") {
    console.log("Loading ADMIN dashboard");

    q = query(
      collection(db, "tickets"),
      orderBy("createdAt", "desc")
    );
  } else {
    console.log("Loading USER dashboard");

    q = query(
      collection(db, "tickets"),
      where("createdBy", "==", uid),
      orderBy("createdAt", "desc")
    );
  }

  return onSnapshot(
    q,

    (snapshot) => {
      console.log("✅ SUCCESS");
      console.log("Documents:", snapshot.size);

      const tickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback({
        total: tickets.length,
        pending: tickets.filter((t) => t.status === "pending").length,
        inProgress: tickets.filter(
          (t) => t.status === "in_progress"
        ).length,
        approved: tickets.filter(
          (t) => t.status === "approved"
        ).length,
        declined: tickets.filter(
          (t) => t.status === "declined"
        ).length,
      });
    },

    (error) => {
      if (
        error.code === "permission-denied" &&
        auth.currentUser === null
      ) {
        return;
      }

      console.error("Dashboard listener:", error.code, error.message);
    }
  );
};