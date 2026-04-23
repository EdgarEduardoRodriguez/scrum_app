import { useEffect, useRef } from "react";
import { Bell, X, Check, UserPlus, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

// ─── Helpers ──────────────────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  if (h < 24) return `hace ${h}h`;
  return `hace ${d}d`;
}

const ROLE_LABELS = {
  Developer: "Developer",
  Tester: "Tester",
  "Product Owner": "Product Owner",
  Observer: "Observer",
  "Scrum Master": "Scrum Master",
};

// ─── Íconos por tipo ──────────────────────────────────────────────────────
function NotifIcon({ type }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
  if (type === "project_invitation")
    return <div className={`${base} bg-blue-50 text-blue-600`}><UserPlus className="w-4 h-4" /></div>;
  if (type === "invitation_accepted")
    return <div className={`${base} bg-green-50 text-green-600`}><CheckCircle2 className="w-4 h-4" /></div>;
  if (type === "invitation_rejected")
    return <div className={`${base} bg-red-50 text-red-600`}><X className="w-4 h-4" /></div>;
  if (type === "role_changed")
    return <div className={`${base} bg-purple-50 text-purple-600`}><ShieldCheck className="w-4 h-4" /></div>;
  return <div className={`${base} bg-slate-100 text-slate-500`}><Bell className="w-4 h-4" /></div>;
}

// ─── Tarjeta individual ───────────────────────────────────────────────────
function NotificationCard({ notification, onMarkRead, onRespond }) {
  const { id, type, read, created_at, payload, _responded } = notification;

  const handleClick = () => {
    if (!read) onMarkRead(id);
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b border-slate-100 transition-colors cursor-default ${
        read ? "bg-white" : "bg-blue-50/40"
      }`}
    >
      <div className="flex gap-3">
        <NotifIcon type={type} />

        <div className="flex-1 min-w-0">
          {/* Contenido según tipo */}
          {type === "project_invitation" && (
            <>
              <p className="text-sm text-slate-800 leading-snug">
                <span className="font-semibold text-blue-600">{payload.invited_by_name}</span>{" "}
                te invitó a{" "}
                <span className="font-medium">{payload.project_name}</span>{" "}
                como{" "}
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                >
                  {ROLE_LABELS[payload.role] || payload.role}
                </span>
              </p>

              {!_responded ? (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRespond(id, payload.invitation_id, "accept"); }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Check className="w-3 h-3" /> Aceptar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRespond(id, payload.invitation_id, "reject"); }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium border border-slate-300 text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3 h-3" /> Rechazar
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1.5">
                  {_responded === "accept" ? "✓ Aceptaste esta invitación" : "✗ Rechazaste esta invitación"}
                </p>
              )}
            </>
          )}

          {type === "invitation_accepted" && (
            <p className="text-sm text-slate-800 leading-snug">
              <span className="font-semibold">{payload.user_name}</span>{" "}
              aceptó tu invitación y se unió a{" "}
              <span className="font-medium">{payload.project_name}</span>{" "}
              como <span className="font-medium">{payload.role}</span>
            </p>
          )}

          {type === "invitation_rejected" && (
            <p className="text-sm text-slate-800 leading-snug">
              <span className="font-semibold">{payload.user_name}</span>{" "}
              rechazó la invitación a{" "}
              <span className="font-medium">{payload.project_name}</span>
            </p>
          )}

          {type === "role_changed" && (
            <p className="text-sm text-slate-800 leading-snug">
              Tu rol en <span className="font-medium">{payload.project_name}</span>{" "}
              cambió a{" "}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                {payload.new_role}
              </span>
            </p>
          )}

          <p className="text-xs text-slate-400 mt-1">{timeAgo(created_at)}</p>
        </div>

        {/* Indicador no leído */}
        {!read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
}

// ─── Panel principal ───────────────────────────────────────────────────────
export default function NotificationsPanel({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, respondToInvitation } =
    useNotifications();
  const panelRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
      style={{ maxHeight: "520px", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Marcar todas leídas
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Bell className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={markAsRead}
              onRespond={respondToInvitation}
            />
          ))
        )}
      </div>
    </div>
  );
}