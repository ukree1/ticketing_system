import { db } from "../firebase"
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp
} from "firebase/firestore"

const ADMIN_EMAIL = "admin@ticketing.com"

// ==========================
// SIMPLE CACHE
// ==========================
const userCache = {}

// ==========================
// CREATE USER PROFILE (ADMIN LOCK FIX)
// ==========================
export const createUserProfile = async (user) => {
  const role =
    user.email === ADMIN_EMAIL ? "admin" : "user"

  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    role,
    disabled: false,
    createdAt: serverTimestamp()
  })
}

// ==========================
// GET USER ROLE (SAFE + ADMIN PROTECTION)
// ==========================
export const getUserRole = async (uid) => {
  if (!uid) return "user"

  const snap = await getDoc(doc(db, "users", uid))

  if (!snap.exists()) return "user"

  const data = snap.data()

  // 🔥 HARD LOCK: admin email is always admin
  if (data.email === ADMIN_EMAIL) {
    return "admin"
  }

  return data.role || "user"
}

// ==========================
// GET USER EMAIL (CACHE + SAFE)
// ==========================
export const getUserEmail = async (uid) => {
  if (!uid) return "Unknown User"

  if (userCache[uid]) return userCache[uid]

  const snap = await getDoc(doc(db, "users", uid))

  if (!snap.exists()) return "Unknown User"

  const email = snap.data().email || "Unknown User"

  userCache[uid] = email

  return email
}

// ==========================
// GET ALL USERS
// ==========================
export const getUsers = async () => {
  const snap = await getDocs(collection(db, "users"))

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

// ==========================
// UPDATE ROLE (PROTECTED)
// ==========================
export const updateUserRole = async (uid, role) => {
  const snap = await getDoc(doc(db, "users", uid))

  if (snap.exists()) {
    const user = snap.data()

    // 🚫 BLOCK CHANGING ADMIN EMAIL ROLE
    if (user.email === ADMIN_EMAIL) {
      throw new Error("Cannot modify main admin account")
    }
  }

  await updateDoc(doc(db, "users", uid), {
    role,
    updatedAt: serverTimestamp()
  })
}

// ==========================
// ENABLE / DISABLE USER (PROTECTED)
// ==========================
export const toggleUserStatus = async (uid, disabled) => {
  const snap = await getDoc(doc(db, "users", uid))

  if (snap.exists()) {
    const user = snap.data()

    // 🚫 BLOCK DISABLING ADMIN
    if (user.email === ADMIN_EMAIL) {
      throw new Error("Cannot disable admin account")
    }
  }

  await updateDoc(doc(db, "users", uid), {
    disabled,
    updatedAt: serverTimestamp()
  })
}

// ==========================
// DELETE USER (PROTECTED)
// ==========================
export const deleteUser = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid))

  if (snap.exists()) {
    const user = snap.data()

    // 🚫 BLOCK DELETING ADMIN
    if (user.email === ADMIN_EMAIL) {
      throw new Error("Cannot delete admin account")
    }
  }

  await deleteDoc(doc(db, "users", uid))
}