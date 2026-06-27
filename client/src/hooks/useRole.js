import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getUserRole } from "../services/userService";

export default function useRole() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setRole(null);
        return;
      }

      try {
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
      } catch (error) {
        console.error("Failed to get user role:", error);
        setRole("user");
      }
    });

    return () => unsubscribe();
  }, []);

  return role;
}