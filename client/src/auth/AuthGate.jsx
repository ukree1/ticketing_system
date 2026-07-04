import { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => {
      setReady(true);
    });

    return () => unsub();
  }, []);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Checking session...
      </div>
    );
  }

  return children;
}