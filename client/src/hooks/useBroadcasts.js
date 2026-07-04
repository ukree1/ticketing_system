import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { listenBroadcasts } from "../services/broadcastService";
import { getUserProfile } from "../services/userService";

const toMillis = (ts) => ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);

export default function useBroadcasts(isAdmin) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSeenAt, setLastSeenAt] = useState(null);

  useEffect(() => {
    let unsubscribeBroadcasts = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      unsubscribeBroadcasts();

      if (!user) {
        setMessages([]);
        setLastSeenAt(null);
        setLoading(false);
        return;
      }

      if (!isAdmin) {
        try {
          const profile = await getUserProfile(user.uid);
          setLastSeenAt(profile?.lastSeenBroadcastAt || null);
        } catch {
          setLastSeenAt(null);
        }
      }

      setLoading(true);

      unsubscribeBroadcasts = listenBroadcasts(
        (data) => {
          setMessages(data);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      unsubscribeBroadcasts();
      unsubscribeAuth();
    };
  }, [isAdmin]);

  // One-way channel: only regular users accumulate "unread from admin".
  const unreadCount = isAdmin
    ? 0
    : messages.filter((m) => toMillis(m.createdAt) > toMillis(lastSeenAt)).length;

  return { messages, loading, unreadCount };
}