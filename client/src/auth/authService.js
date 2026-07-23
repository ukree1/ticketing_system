import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { createUserProfile } from "../services/userService";
import { authFlags } from "../utils/authFlags";

// ======================
// REGISTER
// ======================
export const registerUser = async (email, password) => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await createUserProfile(credential.user);

  return credential;
};

// ======================
// LOGIN
// ======================
export const loginUser = async (email, password) => {
  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const ref = doc(db, "users", credential.user.uid);
  const snap = await getDoc(ref);

  // User profile missing? Create it automatically.
  if (!snap.exists()) {
    await createUserProfile(credential.user);
    return credential;
  }

  const data = snap.data();

  if (data.disabled) {
    await signOut(auth);
    throw new Error("This account has been disabled by the administrator.");
  }

  return credential;
};

// ======================
// LOGOUT
// ======================
// Flip the flag first so any Firestore listener callback that fires
// during the brief window between "token invalidated" and "component
// unmounted" (Sidebar's/Navbar's onSnapshot listeners in particular)
// knows to treat a permission-denied error as expected sign-out noise
// instead of a real failure.
export const logoutUser = async () => {
  authFlags.loggingOut = true;

  try {
    await signOut(auth);
  } finally {
    // Give React a tick to unmount listener-owning components before
    // resetting the flag, so it doesn't mask a genuine error after a
    // fresh login later in the session.
    setTimeout(() => {
      authFlags.loggingOut = false;
    }, 1000);
  }
};