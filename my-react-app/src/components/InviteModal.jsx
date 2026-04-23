import { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Loader2, Check } from "lucide-react";
import apiFetch from "../utils/api";

// ─── Mock de usuarios buscables (reemplazar con backend) ──────────────────
const USE_MOCK = true;
const MOCK_USERS = [
  { id: "10", first_name: "Carlos", last_name: "Ruíz", email: "carlos@uni.edu", username: "carlos@uni.edu" },
  { id: "11", first_name: "Ana", last_name: "López", email: "ana@uni.edu", username: "ana@uni.edu" },
  { id: "12", first_name: "Pedro", last_name: "Hernández", email: "pedro@uni.edu", username: "pedro@uni.edu" },
  { id: "13", first_name: "Sara", last_name: "Johnson", email: "sara@uni.edu", username: "sara@uni.edu" },
  { id: "14", first_name: "David", last_name: "Park", email: "david@uni.edu", username: "david@uni.edu" },
];

const ROLES = [
  { value: "Developer", label: "Developer", desc: "Desarrolla funcionalidades y mueve tareas" },
  { value: "Tester", label: "Tester", desc: "Prueba y reporta bugs en el proyecto" },
  { value: "Product Owner", label: "Product Owner", desc: "Gestiona el backlog y prioridades" },
  { value: "Observer", label: "Observer", desc: "Solo lectura: ve tablero y reportes" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function initials(user) {
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
function avatarColor(userId) {
  return AVATAR_COLORS[parseInt(userId, 10) % AVATAR_COLORS.length];
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function InviteModal({ projectId, projectName, existingMemberIds = [], onClose, onInvited }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("Developer");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus automático al abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        if (USE_MOCK) {
          const q = query.toLowerCase();
          const filtered = MOCK_USERS.filter(
            (u) =>
              !existingMemberIds.includes(u.id) &&
              (`${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q))
          );
          setResults(filtered);
        } else {
          const res = await apiFetch(`/api/users/search/?q=${encodeURIComponent(query)}&project_id=${projectId}`);
          const data = await res.json();
          setResults(data);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, projectId, existingMemberIds]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setResults([]);
    setQuery(`${user.first_name} ${user.last_name}`);
    setError("");
  };

  const handleClearUser = () => {
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
      if (!USE_MOCK) {
        const res = await apiFetch(`/api/projects/${projectId}/invitations/`, {
          method: "POST",
          body: JSON.stringify({ invited_user_id: selectedUser.id, role: selectedRole }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || "Error al enviar la invitación");
        }
      }
      setSent(true);
      onInvited?.({ user: selectedUser, role: selectedRole });
      setTimeout(onClose, 1600);
    } catch (e) {
      setError(e.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Invitar al proyecto</h2>
            <p className="text-sm text-slate-500 mt-0.5">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Buscador */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Buscar usuario
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (selectedUser) setSelectedUser(null); }}
                placeholder="Nombre o correo..."
                className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
              )}
              {selectedUser && (
                <button
                  onClick={handleClearUser}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Resultados */}
            {results.length > 0 && !selectedUser && (
              <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(user.id) }}
                    >
                      {initials(user)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && results.length === 0 && !searching && !selectedUser && (
              <p className="text-xs text-slate-400 mt-2 pl-1">
                No se encontraron usuarios disponibles para invitar.
              </p>
            )}

            {/* Usuario seleccionado */}
            {selectedUser && (
              <div className="mt-2 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(selectedUser.id) }}
                >
                  {initials(selectedUser)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
              </div>
            )}
          </div>

          {/* Selector de rol */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rol a asignar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                    selectedRole === role.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className={`text-sm font-medium ${selectedRole === role.value ? "text-blue-700" : "text-slate-700"}`}>
                    {role.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedUser || sending || sent}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              sent
                ? "bg-green-500 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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