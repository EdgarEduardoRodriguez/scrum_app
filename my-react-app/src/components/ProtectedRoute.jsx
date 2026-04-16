import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Este componente protege rutas privadas:
// - Si hay sesión válida: renderiza el contenido (children)
// - Si no hay sesión: redirige al login

export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Guardamos la ruta solicitada para que, al hacer login,
        // podamos regresar al usuario exactamente donde quería entrar.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}