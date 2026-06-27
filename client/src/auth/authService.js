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
export const logoutUser = () => signOut(auth);