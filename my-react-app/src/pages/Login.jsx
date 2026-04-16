// Hooks básicos para estado local y efectos de ciclo de vida.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
 
export default function Login() {
  // Hook para redireccionar al usuario.
  const navigate = useNavigate();
  // Nos permite saber desde qué ruta intentó entrar (útil para redirección post-login).
  const location = useLocation();
  // Estado global de autenticación (proveído por AuthContext).
  const { isAuthenticated, login } = useAuth();
 
  // Campos del formulario
  const [email, setEmail] = useState("");  
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
 
  // Si ya estás logueado y entras a /login, te mando a la app
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);
 
  const handleSubmit = async (e) => {
    // Evita que el navegador recargue la página al enviar el formulario.
    e.preventDefault();
    setLoading(true);
    try {
      // Delegamos el login al contexto para centralizar manejo de tokens/sesión.
      await login({ email, password });
      // Si ProtectedRoute guardó una ruta previa, volvemos ahí; si no, al home.
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Preferimos mostrar el mensaje real del backend cuando venga disponible.
      const msg = err?.detail || (err?.non_field_errors && err.non_field_errors.join(", ")) || "Error al iniciar sesión";
      alert(msg);
    } finally {
      // Pase lo que pase, quitamos el estado de carga.
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-foreground">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground mt-1">Ingresa con tu correo y contraseña.</p>
 
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@ejemplo.com"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              required
            />
          </div>
 
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              required
            />
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
 
        {/* Botón para ir a la pantalla de registro */}
        <button type="button" onClick={() => navigate("/registro")} className="w-full mt-4 text-sm text-primary hover:underline">
          ¿No tienes cuenta? Regístrate
        </button>
 
        <p className="text-xs text-muted-foreground mt-4">Tip: al cerrar sesión borraremos el estado del localStorage.</p>
      </div>
    </div>
  );
}
