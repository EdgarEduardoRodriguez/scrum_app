import { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Loader2, Check } from "lucide-react";
import { apiFetch } from "../utils/api";

const ROLES = [
  { value: "Developer",     label: "Developer",     desc: "Desarrolla funcionalidades y mueve tareas" },
  { value: "Tester",        label: "Tester",         desc: "Prueba y reporta bugs en el proyecto" },
  { value: "Product Owner", label: "Product Owner",  desc: "Gestiona el backlog y prioridades" },
  { value: "Observer",      label: "Observer",        desc: "Solo lectura: ve tablero y reportes" },
];

const AVATAR_COLORS = ["#007BFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(parseInt(String(id).replace(/\D/g, "") || "0", 10)) % AVATAR_COLORS.length];
}

function initials(user) {
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

export default function InviteModal({ projectId, projectName, existingMemberIds = [], onClose, onInvited }) {
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("Developer");
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(false);
  const [error, setError]             = useState("");
  const [searching, setSearching]     = useState(false);
  const inputRef  = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Búsqueda en tiempo real contra backend (usuarios con cuenta)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await apiFetch(`/api/auth/projects/${projectId}/users/search/?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "No se pudo buscar usuarios");
        }
        const users = await res.json();
        const filtered = users.filter((u) => !existingMemberIds.includes(String(u.id)));
        setResults(filtered);
      } catch (e) {
        setResults([]);
        setError(e.message || "Error buscando usuarios");
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [query, existingMemberIds]);

  const handleSelect = (user) => {
    setSelectedUser(user);
    setResults([]);
    setQuery(`${user.first_name} ${user.last_name}`);
    setError("");
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSend = async () => {
    if (!selectedUser) { setError("Selecciona un usuario primero."); return; }
    setSending(true);
    setError("");

    try {
      const res = await apiFetch(`/api/auth/projects/${projectId}/members/`, {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUser.id,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "No se pudo enviar la invitación");
      }

      setSending(false);
      setSent(true);
      onInvited?.({ user: selectedUser, role: selectedRole });
      setTimeout(onClose, 1400);
    } catch (e) {
      setSending(false);
      setError(e.message || "No se pudo enviar la invitación");
    }
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Invitar al proyecto</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{projectName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Buscador */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Buscar usuario registrado
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (selectedUser) setSelectedUser(null); }}
                placeholder="Nombre o correo..."
                className="w-full pl-9 pr-9 py-2.5 border border-input rounded-lg text-sm bg-input-background focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground"
              />
              {selectedUser && (
                <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown de resultados */}
            {searching && !selectedUser && (
              <p className="text-xs text-muted-foreground mt-2 pl-1 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando usuarios...
              </p>
            )}

            {results.length > 0 && !selectedUser && (
              <div className="mt-1 border border-border rounded-lg overflow-hidden shadow-md bg-card">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(user.id) }}
                    >
                      {initials(user)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && results.length === 0 && !selectedUser && (
              <p className="text-xs text-muted-foreground mt-2 pl-1">
                No se encontraron usuarios disponibles. Solo aparecen usuarios con cuenta registrada.
              </p>
            )}

            {/* Usuario seleccionado */}
            {selectedUser && (
              <div className="mt-2 flex items-center gap-3 bg-muted border border-border rounded-lg px-3 py-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(selectedUser.id) }}
                >
                  {initials(selectedUser)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Check className="w-4 h-4 text-[#007BFF] flex-shrink-0" />
              </div>
            )}
          </div>

          {/* Selector de rol */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rol a asignar</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                    selectedRole === role.value
                      ? "border-[#007BFF] bg-blue-50"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <p className={`text-sm font-medium ${selectedRole === role.value ? "text-[#007BFF]" : "text-foreground"}`}>
                    {role.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedUser || sending || sent}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              sent
                ? "bg-green-500 text-white"
                : "bg-[#007BFF] hover:bg-[#0056b3] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {sent ? (
              <><Check className="w-4 h-4" /> Invitación enviada</>
            ) : sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Enviar invitación</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}