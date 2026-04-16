import { Bell, Search, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
 
function TopBar({ projectName = "Nombre del Proyecto", sprintNumber = 12 }) {
  const currentDate = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const navigate = useNavigate();
  const { logout, user } = useAuth();
 
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
 
  const initials = (() => {
    const name = user?.first_name || user?.username || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();
 
  return (
    <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{projectName}</h2>
        <p className="text-sm text-muted-foreground">Sprint {sprintNumber} • {currentDate}</p>
      </div>
 
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:border-primary w-64 bg-background"
          />
        </div>
 
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
 
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Salir</span>
        </button>
 
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.first_name || user?.username || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground">Scrum Master</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-primary-foreground font-medium shadow-md">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
 
export default TopBar;
