import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { listenConversations } from "../services/messagingService";

export default function useConversations(isAdmin) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeConversations = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      unsubscribeConversations();

      if (!user) {
        setConversations([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      unsubscribeConversations = listenConversations(
        user.uid,
        isAdmin,
        (data) => {
          setConversations(data);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      unsubscribeConversations();
      unsubscribeAuth();
    };
  }, [isAdmin]);

  // One-way thread: only a regular user accumulates "unread from admin".
  const unreadCount = isAdmin ? 0 : conversations.filter((c) => c.unreadForUser).length;

  return { conversations, loading, unreadCount };
}