import { db, auth, firebaseConfig } from "../firebase";
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

import {
  sendPasswordResetEmail,
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { initializeApp, deleteApp } from "firebase/app";

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

// =======================
// CREATE USER (ADMIN ACTION)
// =======================
// Lets an admin create an account for someone else without being
// signed out themselves. Firebase Auth normally switches the active
// session to whichever user was just created with
// createUserWithEmailAndPassword — so we spin up a throwaway
// secondary app instance, create the account there, write the
// Firestore profile with the main `db`, then tear the secondary
// instance down. The admin's own session on `auth` is never touched.
export const createUser = async ({ email, password, role = "user" }) => {
  const cleanEmail = (email || "").trim();

  if (!cleanEmail || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const secondaryApp = initializeApp(
    firebaseConfig,
    `secondary-${Date.now()}`
  );
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const { user } = await createUserWithEmailAndPassword(
      secondaryAuth,
      cleanEmail,
      password
    );

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: cleanEmail,
      name: cleanEmail.split("@")[0],
      role,
      disabled: false,
      theme: "light",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { uid: user.uid, email: cleanEmail, role };
  } catch (err) {
    console.error("createUser error:", err);

    if (err.code === "auth/email-already-in-use") {
      throw new Error("An account with this email already exists.");
    }
    if (err.code === "auth/invalid-email") {
      throw new Error("That email address looks invalid.");
    }
    if (err.code === "auth/weak-password") {
      throw new Error("Password is too weak.");
    }

    throw new Error(err.message || "Failed to create account.");
  } finally {
    // Clean up the throwaway auth session + app instance either way.
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
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