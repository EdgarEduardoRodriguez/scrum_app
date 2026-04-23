import { useEffect, useRef } from "react";
import { Bell, X, Check, UserPlus, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

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

function NotifIcon({ type }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
  if (type === "project_invitation")
    return <div className={`${base} bg-blue-50 text-[#007BFF]`}><UserPlus className="w-4 h-4" /></div>;
  if (type === "invitation_accepted")
    return <div className={`${base} bg-green-50 text-green-600`}><CheckCircle2 className="w-4 h-4" /></div>;
  if (type === "invitation_rejected")
    return <div className={`${base} bg-red-50 text-destructive`}><X className="w-4 h-4" /></div>;
  if (type === "role_changed")
    return <div className={`${base} bg-purple-50 text-purple-600`}><ShieldCheck className="w-4 h-4" /></div>;
  return <div className={`${base} bg-muted text-muted-foreground`}><Bell className="w-4 h-4" /></div>;
}

function NotificationCard({ notification, onMarkRead, onRespond }) {
  const { id, type, read, created_at, payload, _responded } = notification;

  return (
    <div
      onClick={() => { if (!read) onMarkRead(id); }}
      className={`px-4 py-3 border-b border-border cursor-default transition-colors ${
        read ? "bg-card" : "bg-blue-50/30"
      }`}
    >
      <div className="flex gap-3">
        <NotifIcon type={type} />
        <div className="flex-1 min-w-0">

          {type === "project_invitation" && (
            <>
              <p className="text-sm text-foreground leading-snug">
                Fuiste invitado a{" "}
                <span className="font-semibold">{payload.project_name}</span>{" "}
                como{" "}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-[#007BFF]">
                  {payload.role}
                </span>
              </p>
              {!_responded ? (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRespond(id, payload.invitation_id, "accept"); }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#007BFF] text-white rounded-md hover:bg-[#0056b3] transition-colors"
                  >
                    <Check className="w-3 h-3" /> Aceptar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRespond(id, payload.invitation_id, "reject"); }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium border border-border text-muted-foreground rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="w-3 h-3" /> Rechazar
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {_responded === "accept" ? "✓ Aceptaste esta invitación" : "✗ Rechazaste esta invitación"}
                </p>
              )}
            </>
          )}

          {type === "invitation_accepted" && (
            <p className="text-sm text-foreground leading-snug">
              <span className="font-semibold">{payload.user_name}</span> aceptó unirse a{" "}
              <span className="font-medium">{payload.project_name}</span> como{" "}
              <span className="font-medium">{payload.role}</span>
            </p>
          )}

          {type === "role_changed" && (
            <p className="text-sm text-foreground leading-snug">
              Tu rol en <span className="font-medium">{payload.project_name}</span>{" "}
              cambió a{" "}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                {payload.new_role}
              </span>
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-1">{timeAgo(created_at)}</p>
        </div>

        {!read && (
          <div className="w-2 h-2 rounded-full bg-[#007BFF] flex-shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
}

export default function NotificationsPanel({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, respondToInvitation } =
    useNotifications();
  const panelRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
      style={{ maxHeight: "520px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-bold bg-[#007BFF] text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-[#007BFF] hover:text-[#0056b3] font-medium transition-colors"
            >
              Marcar todas leídas
            </button>
          )}
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
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