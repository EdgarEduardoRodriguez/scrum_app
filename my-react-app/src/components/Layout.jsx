import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

// Este layout es la "plantilla" principal de la app privada.
// Todo lo que esté dentro de rutas protegidas se pinta aquí.
export default function Layout() {
  // Datos del proyecto que mostramos arriba en el TopBar.
  const projectName = "Sistema de Biblioteca Universitaria";
  const currentSprint = 12;
  
  return (
    <div className="flex h-screen bg-background">
      {/* Menú lateral fijo con navegación principal */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior con nombre de proyecto, fecha, usuario y logout */}
        <TopBar projectName={projectName} sprintNumber={currentSprint} />
        
        <main className="flex-1 overflow-auto p-8">
          {/* Aquí react-router renderiza la vista hija activa */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}