import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../utils/api";
 
export default function Register() {
  const navigate = useNavigate();
 
  // Campos del formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw err;
      }
      alert("Registro completado. Ahora inicia sesión.");
      navigate("/login");
    } catch (err) {
      const msg = err?.detail || "Error al registrar";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground mt-1">Regístrate con tu nombre, correo y contraseña.</p>
 
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              required
            />
          </div>
 
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
            {loading ? "Registrando..." : "Registrarme"}
          </button>
        </form>
 
        {/* Link para regresar al login */}
        <button onClick={() => navigate("/login")} className="w-full mt-4 text-sm text-primary hover:underline">
          Ya tengo cuenta, volver al login
        </button>
      </div>
    </div>
  );
}
