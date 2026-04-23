import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectRoute from './components/ProjectRoute';

import Dashboard from './pages/Dashboard';
import KanbanPage from './pages/KanbanPage';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import Register from './pages/Register';
import ProjectsPage from './pages/ProjectsPage';
import TeamPage from './pages/TeamPage'; // ← nuevo

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/*
          Ruta de selección de proyecto:
          Requiere sesión pero NO requiere proyecto activo.
        */}
        <Route
          path="/proyectos"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />

        {/*
          Rutas protegidas del dashboard:
          Requieren sesión Y proyecto activo.
          Si no hay proyecto, ProjectRoute redirige a /proyectos.
        */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProjectRoute>
                <Layout />
              </ProjectRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="tareas" element={<KanbanPage />} />
          <Route path="sprints" element={<ComingSoon title="Gestión de Sprints" />} />
          <Route path="equipo" element={<TeamPage />} /> {/* ← antes era ComingSoon */}
          <Route path="reportes" element={<ComingSoon title="Reportes y Métricas" />} />
          <Route path="configuracion" element={<ComingSoon title="Configuración" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;