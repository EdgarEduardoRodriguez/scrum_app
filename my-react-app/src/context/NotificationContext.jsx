import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import apiFetch from "../utils/api";

const NotificationContext = createContext(null);

// ─── Mock local (se reemplaza cuando el backend esté listo) ────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "project_invitation",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    payload: {
      invitation_id: "inv-1",
      project_id: "2",
      project_name: "App Móvil de Pagos",
      project_color: "#7C3AED",
      invited_by_name: "María García",
      role: "Developer",
    },
  },
  {
    id: "2",
    type: "role_changed",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    payload: {
      project_name: "Sistema de Biblioteca Universitaria",
      new_role: "Tester",
    },
  },
  {
    id: "3",
    type: "invitation_accepted",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    payload: {
      user_name: "Carlos Ruíz",
      project_name: "Sistema de Biblioteca Universitaria",
      role: "Tester",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
const USE_MOCK = true; // Cambia a false cuando el backend esté listo

async function fetchFromBackend() {
  const res = await apiFetch("/api/notifications/");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Carga inicial y polling cada 30s
  const fetchNotifications = useCallback(async () => {
    try {
      if (USE_MOCK) {
        setNotifications(MOCK_NOTIFICATIONS);
      } else {
        const data = await fetchFromBackend();
        setNotifications(data);
      }
    } catch {
      // silencioso: no romper la app si falla
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(pollingRef.current);
  }, [fetchNotifications]);

  // Marca una notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    if (!USE_MOCK) {
      try {
        await apiFetch(`/api/notifications/${notificationId}/read/`, { method: "PATCH" });
      } catch {
        // revertir si falla
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
        );
      }
    }
  }, []);

  // Marca todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Responde a una invitación (accept | reject)
  const respondToInvitation = useCallback(
    async (notificationId, invitationId, action) => {
      // Optimistic: quitar la notificación accionable inmediatamente
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, _responded: action } : n
        )
      );

      if (!USE_MOCK) {
        try {
          await apiFetch(`/api/invitations/${invitationId}/respond/`, {
            method: "PATCH",
            body: JSON.stringify({ action }),
          });
        } catch {
          // revertir
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, read: false, _responded: undefined } : n
            )
          );
        }
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      respondToInvitation,
    }),
    [notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, respondToInvitation]
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