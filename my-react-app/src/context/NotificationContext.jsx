import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetch } from "../utils/api";

const NotificationContext = createContext(null);

function mapInvitationToNotification(inv) {
  const responded = inv.status === "accepted" ? "accept" : inv.status === "rejected" ? "reject" : undefined;
  return {
    id: `notif-${inv.id}`,
    type: "project_invitation",
    read: inv.status !== "pending" || !!inv.is_read,
    created_at: inv.created_at,
    _responded: responded,
    payload: {
      invitation_id: inv.id,
      project_id: inv.project_id,
      project_name: inv.project_name,
      invited_by_name: inv.invited_by_name || "Un compañero",
      role: inv.role,
    },
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);
  const pollingRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Obtener userId del localStorage (guardado por AuthContext)
  const resolveUserId = useCallback(() => {
    try {
      const raw = localStorage.getItem("scrum_user");
      const user = raw ? JSON.parse(raw) : null;
      return user?.id ? String(user.id) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const uid = resolveUserId();
    setUserId(uid);
    if (!uid) { setNotifications([]); return; }
    try {
      const res = await apiFetch("/api/auth/invitations/");
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const invitations = await res.json();
      setNotifications(invitations.map(mapInvitationToNotification));
    } catch {
      setNotifications([]);
    }
  }, [resolveUserId]);

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 10_000); // cada 10s
    return () => clearInterval(pollingRef.current);
  }, [fetchNotifications]);

  // Marcar como leída
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Aceptar o rechazar invitación
  const respondToInvitation = useCallback(
    async (_notificationId, invitationId, action) => {
      try {
        const res = await apiFetch(`/api/auth/invitations/${invitationId}/respond/`, {
          method: "POST",
          body: JSON.stringify({ action }),
        });
        if (!res.ok) return;
        await fetchNotifications();
        if (action === "accept") {
          window.dispatchEvent(new Event("projects:refresh"));
        }
      } catch {
        // silencioso
      }
    },
    [fetchNotifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      respondToInvitation,
    }),
    [notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, respondToInvitation]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de <NotificationProvider>");
  return ctx;
}