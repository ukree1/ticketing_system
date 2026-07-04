import { db, auth } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { sendPasswordResetEmail } from "firebase/auth";

const ADMIN_EMAIL = "admin@ticketing.com";

const userCache = {};

export const createUserProfile = async (user) => {
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return;

  const role =
    user.email === ADMIN_EMAIL ? "admin" : "user";

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    name:
      user.displayName || user.email.split("@")[0],
    role,
    disabled: false,
    theme: "light",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserRole = async (uid) => {
  if (!uid) {
    console.warn("❌ getUserRole: No UID provided.");
    return "user";
  }

  console.log("=================================");
  console.log("GET USER ROLE");
  console.log("UID:", uid);

  try {
    const ref = doc(db, "users", uid);

    console.log("Reading document:", ref.path);

    const snap = await getDoc(ref);

    console.log("Document exists:", snap.exists());

    if (!snap.exists()) {
      console.warn("⚠️ User document not found.");
      return "user";
    }

    console.log("User document data:", snap.data());

    const role = snap.data().role || "user";

    console.log("Detected role:", role);
    console.log("=================================");

    return role;
  } catch (err) {
    console.error("=================================");
    console.error("❌ GET USER ROLE FAILED");
    console.error("UID:", uid);
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    console.error(err);
    console.error("=================================");

    return "user";
  }
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;

  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) return null;

    return {
      uid: snap.id,
      ...snap.data(),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getUserEmail = async (uid) => {
  if (!uid) return "Unknown User";

  if (userCache[uid]) {
    return userCache[uid];
  }

  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      return "Unknown User";
    }

    const email = snap.data().email || "Unknown User";

    userCache[uid] = email;

    return email;
  } catch (err) {
    console.error(err);
    return "Unknown User";
  }
};

export const getUsers = async () => {
  const role = await getUserRole(auth.currentUser?.uid);

  if (role !== "admin") {
    return [];
  }

  try {
    const snap = await getDocs(collection(db, "users"));

    return snap.docs
      .map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }))
      .filter((user) => user.role === "user" && !user.disabled)
      .sort((a, b) =>
        (a.email || "").localeCompare(b.email || "")
      );
  } catch (err) {
    console.error(err);
    return [];
  }
};

// =======================
// GET ADMIN USERS
// =======================
// Used to notify every admin when a regular user submits a new ticket.
export const getAdminUsers = async () => {
  try {
    const snap = await getDocs(collection(db, "users"));

    return snap.docs
      .map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }))
      .filter((user) => user.role === "admin" && !user.disabled);
  } catch (err) {
    console.error("getAdminUsers:", err);
    return [];
  }
};

export const updateUserSettings = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const updateUserRole = async (uid, role) => {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("User not found");
  }

  if (snap.data().email === ADMIN_EMAIL) {
    throw new Error("Cannot modify admin");
  }

  await updateDoc(doc(db, "users", uid), {
    role,
    updatedAt: serverTimestamp(),
  });
};

export const toggleUserStatus = async (uid, disabled) => {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("User not found");
  }

  if (snap.data().email === ADMIN_EMAIL) {
    throw new Error("Cannot modify admin");
  }

  await updateDoc(doc(db, "users", uid), {
    disabled,
    updatedAt: serverTimestamp(),
  });
};
export const deleteUser = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("User not found");
  }

  if (snap.data().email === ADMIN_EMAIL) {
    throw new Error("Cannot delete admin");
  }

  await deleteDoc(doc(db, "users", uid));
};

export const resetUserPassword = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  try {
    await sendPasswordResetEmail(auth, email);

    console.log("📩 Password reset email sent to:", email);
  } catch (err) {
    console.error("Reset password error:", err);
    throw err;
  }
};