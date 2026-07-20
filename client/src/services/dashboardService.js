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
  const role = await getUserRole(uid);

  let q;

  if (role === "admin") {
    q = query(
      collection(db, "tickets"),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      collection(db, "tickets"),
      where("createdBy", "==", uid),
      orderBy("createdAt", "desc")
    );
  }

  return onSnapshot(
    q,

    (snapshot) => {
      const tickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Real per-month ticket counts for the current calendar year,
      // built from each ticket's actual createdAt — replaces the old
      // hardcoded [8, 14, 11, ...] placeholder array the line chart
      // used to render regardless of real data.
      const currentYear = new Date().getFullYear();
      const monthlyCounts = new Array(12).fill(0);

      tickets.forEach((t) => {
        const createdAt = t.createdAt?.toDate ? t.createdAt.toDate() : null;

        if (createdAt && createdAt.getFullYear() === currentYear) {
          monthlyCounts[createdAt.getMonth()] += 1;
        }
      });

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
        monthlyCounts,
        year: currentYear,
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