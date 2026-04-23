import { useState, useRef, useEffect } from "react";
import { Bell, Search, LogOut, FolderOpen, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../context/ProjectContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationsPanel from "./NotificationsPanel";

function TopBar() {
  const currentDate = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { activeProject, clearProject } = useProject();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "Usuario";

  const initials = (() => {
    const parts = fullName.split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  const handleLogout = async () => {
    clearProject();
    await logout();
    navigate("/login");
  };

  const handleSwitchProject = () => {
    clearProject();
    navigate("/proyectos");
  };

  return (
    <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between shadow-sm">
      {/* Info del proyecto activo */}
      <div>
        <div className="flex items-center gap-2">
          {activeProject && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeProject.color }}
            />
          )}
          <h2 className="text-xl font-semibold text-foreground">
            {activeProject?.name || "Sin proyecto"}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sprint {activeProject?.sprintCount ?? 0} • {currentDate}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Buscador */}
        <div className="relative">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:border-primary w-56 bg-background text-sm"
          />
        </div>

        {/* Campana de notificaciones */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Panel de notificaciones */}
          <NotificationsPanel
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
          />
        </div>

        {/* Cambiar proyecto */}
        <button
          onClick={handleSwitchProject}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input hover:bg-muted transition-colors text-sm"
          title="Cambiar proyecto"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden md:block">Proyectos</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input hover:bg-muted transition-colors text-sm"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:block">Salir</span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 ml-1">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-foreground leading-tight">{fullName}</p>
            <p className="text-xs text-muted-foreground">{activeProject?.role || "Scrum Master"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-primary-foreground text-sm font-semibold shadow-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;