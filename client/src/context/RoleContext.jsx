import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { getUserRole, clearRoleCache } from "../services/userService";

const RoleContext = createContext({ role: null, loadingRole: true });

// Single onAuthStateChanged subscription for the whole app. Every
// component that needs the current user's role reads it from here
// instead of independently subscribing to auth state and calling
// getUserRole() itself — that duplication was the root cause of the
// repeated "GET USER ROLE" bursts in the console (Sidebar, Navbar via
// useRole(), and Dashboard were all fetching it separately).
export function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        clearRoleCache(); // stale cache from a previous session shouldn't leak into the next sign-in
        setRole(null);
        setLoadingRole(false);
        return;
      }

      setLoadingRole(true);

      try {
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
      } catch (error) {
        console.error("RoleProvider: failed to get user role:", error);
        setRole("user");
      } finally {
        setLoadingRole(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <RoleContext.Provider value={{ role, loadingRole }}>
      {children}
    </RoleContext.Provider>
  );
}

// Default export matches the old useRole() hook's API exactly (just
// returns the role string), so no call sites need to change.
export default function useRole() {
  return useContext(RoleContext).role;
}

// For places that also need to distinguish "still loading" from
// "loaded and role is null" (e.g. Sidebar's "Loading..." label).
export function useRoleState() {
  return useContext(RoleContext);
}