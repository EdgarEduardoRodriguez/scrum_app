import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import apiFetch from "../utils/api";
 
// AuthContext (sesion) usando JWT con backend
const AuthContext = createContext(null);

const ACCESS_KEY = "scrum_access";
const REFRESH_KEY = "scrum_refresh";
const USER_KEY = "scrum_user";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const api = import.meta.env.VITE_API_URL || "";
  const refreshTimer = useRef(null);

  // util: parse JWT para obtener exp
  const parseJwt = (token) => {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch {
      return null;
    }
  };

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const scheduleRefresh = (accessToken) => {
    clearRefreshTimer();
    const payload = parseJwt(accessToken);
    if (!payload || !payload.exp) return;
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    // refrescar 30 segundos antes de expirar
    const msUntilRefresh = Math.max(expiresAt - now - 30000, 0);
    refreshTimer.current = setTimeout(() => {
      refreshAccess().catch(() => {
        // Si falla el refresh, forzamos logout
        logout();
      });
    }, msUntilRefresh);
  };

  const refreshAccess = async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) throw new Error("No refresh token");
    const res = await apiFetch("/api/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      throw new Error("Refresh failed");
    }
    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.access);
    // reprogramar siguiente refresh
    scheduleRefresh(data.access);
    return data.access;
  };

  // cuando la app carga, restauramos tokens/usuario si existen y programamos refresh
  useEffect(() => {
    const access = localStorage.getItem(ACCESS_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (access && storedUser) {
      setIsAuthenticated(true);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
      scheduleRefresh(access);
    }
    return () => clearRefreshTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // login: llama al backend, guarda tokens y usuario
  const login = async ({ email, password }) => {
    const res = await apiFetch("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username: email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw err;
    }
    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.access);
    localStorage.setItem(REFRESH_KEY, data.refresh);
    // obtener usuario
    const meRes = await apiFetch("/api/auth/me/", { method: "GET" });
    const me = await meRes.json();
    localStorage.setItem(USER_KEY, JSON.stringify(me));
    setUser(me);
    setIsAuthenticated(true);
    scheduleRefresh(data.access);
    return me;
  };

  // logout: opcionalmente blacklist del refresh token en backend, luego limpiar
  const logout = async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (refresh) {
      try {
        await apiFetch("/api/auth/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh }),
        });
      } catch (e) {
        // ignore
      }
    }
    clearRefreshTimer();
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, user, login, logout, refreshAccess }),
    [isAuthenticated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook para usar el contexto facilmente
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}