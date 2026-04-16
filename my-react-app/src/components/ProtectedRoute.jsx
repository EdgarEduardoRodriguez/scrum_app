import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// protectedRoute

// envuelve una ruta/componente
// - si hay sesion: muestra children
// - si no hay sesion: redireje a login

export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // guardamos la ruta a la que intentaba entrar
        // para regresar ahi despues del login 
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}