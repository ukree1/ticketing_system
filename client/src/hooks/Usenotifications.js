import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { listenNotifications } from "../services/notificationService";

/**
 * Single source of truth for the signed-in user's notifications.
 * Mount this once (e.g. in Dashboard) and pass the values down to
 * <NotificationBell /> and <NotificationSidebar /> as props, rather than
 * having each component open its own Firestore listener.
 */
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeNotifications = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      unsubscribeNotifications();

      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      unsubscribeNotifications = listenNotifications(
        user.uid,
        (data) => {
          setNotifications(data);
          setLoading(false);
        },
        (error) => {
          console.error("useNotifications:", error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeAuth();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading };
}