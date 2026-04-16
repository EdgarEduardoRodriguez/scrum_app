import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import KanbanPage from './pages/KanbanPage';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import Register from './pages/Register';

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
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="tareas" element={<KanbanPage />} />

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
