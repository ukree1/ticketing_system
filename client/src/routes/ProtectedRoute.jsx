import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { getUserRole } from "../services/userService";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const unsub = auth.onAuthStateChanged(async (u) => {
      try {
        if (!isMounted) return;

        if (!u) {
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        const userRole = await getUserRole(u.uid);

        if (!isMounted) return;

        setUser(u);
        setRole(userRole || "user");
      } catch (err) {
        console.error("ProtectedRoute Error:", err);

        if (isMounted) {
          setUser(null);
          setRole("user");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Checking access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ROLE CHECK (FIXED SAFE DEFAULT)
  if (
    allowedRoles?.length &&
    !allowedRoles.includes(role || "user")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}