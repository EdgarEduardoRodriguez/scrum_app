import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import KanbanPage from './pages/KanbanPage';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import Register from './pages/Register';

// App es el punto de entrada de las rutas en todo el frontend.
// Aquí definimos qué pantallas son públicas y cuáles requieren sesión.
function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/*
          Rutas protegidas:
          Si NO hay sesión, ProtectedRoute manda a /login.
        */}
        <Route
          path="/"
          element={
            // Envolvemos Layout para que sólo usuarios autenticados entren.
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* index = ruta raíz / */}
          <Route index element={<Dashboard />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="tareas" element={<KanbanPage />} />

          {/* Estas rutas están en estado "próximamente" */}
          <Route path="sprints" element={<ComingSoon title="Gestión de Sprints" />} />
          <Route path="equipo" element={<ComingSoon title="Gestión de Equipo" />} />
          <Route path="reportes" element={<ComingSoon title="Reportes y Métricas" />} />
          <Route path="configuracion" element={<ComingSoon title="Configuración" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
