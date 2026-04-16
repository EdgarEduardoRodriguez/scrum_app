import { LayoutDashboard, ListTodo, Users, Calendar, Settings, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Catálogo de opciones que pintamos en el menú lateral.
// Así evitamos repetir JSX por cada item.
const navItems = [
  { icon: LayoutDashboard, label: 'Tablero', path: '/' },
  { icon: ListTodo, label: 'Tareas', path: '/tareas' },
  { icon: Calendar, label: 'Sprints', path: '/sprints' },
  { icon: Users, label: 'Equipo', path: '/equipo' },
  { icon: BarChart3, label: 'Reportes', path: '/reportes' },
  { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

// Sidebar fijo del lado izquierdo con navegación principal.
export default function Sidebar() {
  // Ruta actual para marcar visualmente la opción activa.
  const location = useLocation();
  
  return (
    <aside className="w-64 bg-card text-foreground flex flex-col h-screen border-r border-border">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">ScrumEstudiantes</h1>
        <p className="text-xs text-muted-foreground mt-1">Gestiona tus proyectos</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            // El ícono viene como componente dentro de cada item.
            const Icon = item.icon;
            // Comparamos path actual vs path del item para cambiar estilos.
            const isActive = location.pathname === item.path;
            return (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}