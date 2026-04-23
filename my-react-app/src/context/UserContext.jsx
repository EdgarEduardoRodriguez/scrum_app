import { createContext, useContext, useMemo } from "react";

// ─── Contexto de usuarios registrados ─────────────────────────────────────
// Los usuarios se guardan en localStorage con la clave "scrum_registered_users"
// cuando alguien se registra. El InviteModal los lee desde aquí.

const UserContext = createContext(null);

const USER_REGISTRY_KEY = "scrum_registered_users";

// Lee todos los usuarios registrados del localStorage
export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USER_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Agrega un usuario al registro cuando se registra
export function registerUser(user) {
  try {
    const current = getRegisteredUsers();
    const exists = current.find((u) => u.email === user.email);
    if (!exists) {
      current.push({
        id: String(user.id || Date.now()),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username || user.email,
      });
      localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(current));
    }
  } catch {
    // silencioso
  }
}

export function UserProvider({ children }) {
  const value = useMemo(() => ({ getRegisteredUsers, registerUser }), []);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUsers() {
  return useContext(UserContext) || { getRegisteredUsers, registerUser };
}