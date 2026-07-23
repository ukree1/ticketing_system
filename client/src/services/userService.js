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

  const role = user.email === ADMIN_EMAIL ? "admin" : "user";

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email.split("@")[0],
    role,
    disabled: false,
    theme: "light",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const createUser = async ({ email, password, role = "user" }) => {
  const cleanEmail = (email || "").trim();

  if (!cleanEmail || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
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
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
};

const roleCache = new Map();

export const getUserRole = async (uid) => {
  if (!uid) {
    console.warn("getUserRole: no UID provided.");
    return "user";
  }

  if (roleCache.has(uid)) {
    return roleCache.get(uid);
  }

  const promise = (async () => {
    try {
      const snap = await getDoc(doc(db, "users", uid));

      if (!snap.exists()) {
        console.warn("getUserRole: user document not found for", uid);
        return "user";
      }

      return snap.data().role || "user";
    } catch (err) {
      console.error("getUserRole failed for", uid, err.code || err.message);
      roleCache.delete(uid);
      return "user";
    }
  })();

  roleCache.set(uid, promise);
  return promise;
};

export const clearRoleCache = (uid) => {
  if (uid) {
    roleCache.delete(uid);
  } else {
    roleCache.clear();
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
      .sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  } catch (err) {
    console.error(err);
    return [];
  }
};

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

// =======================
// UPDATE USER SETTINGS
// =======================
// Updates a user's own settings doc (theme, lastSeenBroadcastAt, etc).
//
// Self-healing for two situations that both surface as a generic
// "permission-denied", even for a fully legitimate, signed-in owner:
//
//  1. The doc doesn't exist at all — recreate it from the live auth
//     user.
//  2. The doc exists but is missing one of the fields the security
//     rules compare (role/disabled/uid/email) — usually from an
//     account created before that field was added to the schema.
//     Reading a missing map key with dot-access in Firestore Rules
//     throws an evaluation error, which Firestore reports back as
//     permission-denied rather than a rules bug. We backfill any
//     missing field with its schema default before writing, so the
//     document converges back to shape. (The rules file itself
//     should also use `.get(field, default)` — see updated
//     firestore.rules — this backfill is defense in depth on top of
//     that.)
export const updateUserSettings = async (uid, data, _isRetry = false) => {
  if (!uid) return;

  const ref = doc(db, "users", uid);

  try {
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      if (auth.currentUser?.uid === uid) {
        await createUserProfile(auth.currentUser);
      } else {
        throw new Error(`updateUserSettings: no profile found for ${uid}`);
      }
    } else {
      const existing = snap.data();
      const backfill = {};

      if (existing.role === undefined) {
        backfill.role = existing.email === ADMIN_EMAIL ? "admin" : "user";
      }
      if (existing.disabled === undefined) {
        backfill.disabled = false;
      }
      if (existing.uid === undefined) {
        backfill.uid = uid;
      }
      if (existing.email === undefined && auth.currentUser?.uid === uid) {
        backfill.email = auth.currentUser.email;
      }

      if (Object.keys(backfill).length > 0) {
        await setDoc(ref, backfill, { merge: true });
      }
    }

    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    if (err.code === "permission-denied" && !_isRetry) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return updateUserSettings(uid, data, true);
    }
    throw err;
  }
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

  clearRoleCache(uid);
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
  clearRoleCache(uid);
};

export const resetUserPassword = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent to:", email);
  } catch (err) {
    console.error("Reset password error:", err);
    throw err;
  }
};