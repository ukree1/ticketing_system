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

const ADMIN_EMAIL = "admin@ticketing.com";

const userCache = {};

// ==========================
// CREATE USER PROFILE
// ==========================
export const createUserProfile = async (user) => {
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // Don't overwrite an existing profile
  if (snap.exists()) return;

  const role =
    user.email === ADMIN_EMAIL ? "admin" : "user";

  await setDoc(ref, {
    email: user.email,
    role,
    disabled: false,
    createdAt: serverTimestamp(),
  });
};

// ==========================
// GET USER ROLE
// Auto-create profile if missing
// ==========================
export const getUserRole = async (uid) => {
  if (!uid) return "user";

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const currentUser = auth.currentUser;

    if (currentUser && currentUser.uid === uid) {
      const role =
        currentUser.email === ADMIN_EMAIL
          ? "admin"
          : "user";

      await setDoc(ref, {
        email: currentUser.email,
        role,
        disabled: false,
        createdAt: serverTimestamp(),
      });

      return role;
    }

    return "user";
  }

  const data = snap.data();

  // Always protect the main admin account
  if (data.email === ADMIN_EMAIL) {
    return "admin";
  }

  return data.role || "user";
};

// ==========================
// GET USER EMAIL
// ==========================
export const getUserEmail = async (uid) => {
  if (!uid) return "Unknown User";

  if (userCache[uid]) {
    return userCache[uid];
  }

  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    return "Unknown User";
  }

  const email = snap.data().email || "Unknown User";

  userCache[uid] = email;

  return email;
};

// ==========================
// GET ALL USERS
// ==========================
export const getUsers = async () => {
  const snap = await getDocs(collection(db, "users"));

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ==========================
// UPDATE ROLE
// ==========================
export const updateUserRole = async (uid, role) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("User not found");
  }

  const user = snap.data();

  if (user.email === ADMIN_EMAIL) {
    throw new Error("Cannot modify main admin account");
  }

  await updateDoc(ref, {
    role,
    updatedAt: serverTimestamp(),
  });
};

// ==========================
// ENABLE / DISABLE USER
// ==========================
export const toggleUserStatus = async (
  uid,
  disabled
) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("User not found");
  }

  const user = snap.data();

  if (user.email === ADMIN_EMAIL) {
    throw new Error("Cannot disable admin account");
  }

  await updateDoc(ref, {
    disabled,
    updatedAt: serverTimestamp(),
  });
};

// ==========================
// DELETE USER
// ==========================
export const deleteUser = async (uid) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("User not found");
  }

  const user = snap.data();

  if (user.email === ADMIN_EMAIL) {
    throw new Error("Cannot delete admin account");
  }

  await deleteDoc(ref);
};