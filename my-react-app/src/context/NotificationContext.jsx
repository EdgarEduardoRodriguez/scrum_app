import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";

const NotificationContext = createContext(null);

// ─── Clave de invitaciones pendientes ─────────────────────────────────────
function pendingKey(userId) {
  return `scrum_pending_invitations_${userId}`;
}

// ─── Lee invitaciones del localStorage y las convierte en notificaciones ──
function loadNotificationsForUser(userId) {
  try {
    const raw = localStorage.getItem(pendingKey(userId));
    const invitations = raw ? JSON.parse(raw) : [];
    return invitations.map((inv) => ({
      id: `notif-${inv.id}`,
      type: "project_invitation",
      read: inv.status !== "pending",
      created_at: inv.invited_at,
      _responded: inv.status !== "pending" ? inv.status : undefined,
      payload: {
        invitation_id: inv.id,
        project_id: inv.project_id,
        project_name: inv.project_name,
        invited_by_name: inv.invited_by || "Un compañero",
        role: inv.role,
      },
    }));
  } catch {
    return [];
  }
}

// Actualiza el estado de una invitación en localStorage
function updateInvitationStatus(userId, invitationId, status) {
  try {
    const key = pendingKey(userId);
    const raw = localStorage.getItem(key);
    const invitations = raw ? JSON.parse(raw) : [];
    const updated = invitations.map((inv) =>
      inv.id === invitationId ? { ...inv, status } : inv
    );
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // silencioso
  }
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

  const fetchNotifications = useCallback(() => {
    const uid = resolveUserId();
    setUserId(uid);
    if (!uid) { setNotifications([]); return; }
    const notifs = loadNotificationsForUser(uid);
    setNotifications(notifs);
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
    (notificationId, invitationId, action) => {
      const uid = resolveUserId();

      // Actualizar en localStorage
      if (uid) updateInvitationStatus(uid, invitationId, action);

      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, _responded: action }
            : n
        )
      );

      // Si aceptó: agregar el proyecto a su lista visible
      if (action === "accept") {
        try {
          const raw = localStorage.getItem(pendingKey(uid));
          const invitations = raw ? JSON.parse(raw) : [];
          const inv = invitations.find((i) => i.id === invitationId);
          if (inv) {
            const JOINED_KEY = `scrum_joined_projects_${uid}`;
            const joined = JSON.parse(localStorage.getItem(JOINED_KEY) || "[]");
            const alreadyJoined = joined.find((p) => p.project_id === inv.project_id);
            if (!alreadyJoined) {
              joined.push({
                project_id: inv.project_id,
                project_name: inv.project_name,
                role: inv.role,
                joined_at: new Date().toISOString(),
              });
              localStorage.setItem(JOINED_KEY, JSON.stringify(joined));
            }
          }
        } catch {
          // silencioso
        }
      }
    },
    [resolveUserId]
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