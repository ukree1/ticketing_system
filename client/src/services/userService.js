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

// =======================
// GET USER ROLE (cached)
// =======================
// getUserRole() is called from a lot of places independently — the
// RoleProvider on auth change, dashboardService and ticketService when
// setting up their listeners, and getUsers() below. Without caching,
// every one of those triggers its own Firestore read for the same uid
// at nearly the same moment, which is what produced the console spam
// and duplicate reads. We memoize the *in-flight promise* per uid so
// concurrent/duplicate calls all resolve from the same read.
const roleCache = new Map(); // uid -> Promise<string>

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
      roleCache.delete(uid); // don't cache a failed lookup
      return "user";
    }
  })();

  roleCache.set(uid, promise);
  return promise;
};

// Call after anything that can change a stored role, or on sign-out,
// so the next getUserRole() call re-reads instead of serving stale data.
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

  // The cached role for this uid is now stale — clear it so the next
  // getUserRole() call re-reads the new value instead of the old one.
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