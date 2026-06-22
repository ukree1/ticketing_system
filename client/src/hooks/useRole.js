import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

export default function useRole() {
  const [role, setRole] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return

      const snap = await getDoc(doc(db, "users", auth.currentUser.uid))
      setRole(snap.exists() ? snap.data().role : "user")
    }

    load()
  }, [])

  return role
}