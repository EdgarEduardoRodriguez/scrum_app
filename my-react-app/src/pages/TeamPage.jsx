import { useState } from "react";
import { UserPlus, ShieldCheck, ChevronDown, Check, Users } from "lucide-react";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../auth/AuthContext";
import InviteModal from "../components/InviteModal";
import apiFetch from "../utils/api";

// ─── Mock de miembros del proyecto (reemplazar con backend) ───────────────
const USE_MOCK = true;

const MOCK_MEMBERS = [
  {
    id: "1",
    user_id: "1",
    first_name: "María",
    last_name: "García",
    email: "maria@uni.edu",
    role: "Scrum Master",
    avatar_color: "#10B981",
    joined_at: "2024-01-15",
  },
  {
    id: "2",
    user_id: "2",
    first_name: "Juan",
    last_name: "Pérez",
    email: "juan@uni.edu",
    role: "Developer",
    avatar_color: "#3B82F6",
    joined_at: "2024-01-16",
  },
  {
    id: "3",
    user_id: "3",
    first_name: "Carlos",
    last_name: "Ruíz",
    email: "carlos@uni.edu",
    role: "Tester",
    avatar_color: "#F59E0B",
    joined_at: "2024-01-20",
  },
];

const ROLE_OPTIONS = ["Developer", "Tester", "Product Owner", "Observer"];

const ROLE_STYLES = {
  "Scrum Master": "bg-red-50 text-red-700 border-red-200",
  Developer:      "bg-blue-50 text-blue-700 border-blue-200",
  Tester:         "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Product Owner":"bg-purple-50 text-purple-700 border-purple-200",
  Observer:       "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function initials(member) {
  return `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Selector de rol inline ───────────────────────────────────────────────
function RoleSelector({ currentRole, memberId, isLeader, onRoleChange }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isLeader) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_STYLES["Scrum Master"]}`}>
        <ShieldCheck className="w-3 h-3" /> Scrum Master
      </span>
    );
  }

  const handleChange = async (newRole) => {
    setOpen(false);
    if (newRole === currentRole) return;
    setLoading(true);
    await onRoleChange(memberId, newRole);
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${
          ROLE_STYLES[currentRole] || "bg-slate-100 text-slate-600 border-slate-200"
        } ${loading ? "opacity-60" : ""}`}
      >
        {currentRole}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1 overflow-hidden">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                onClick={() => handleChange(role)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {role}
                {role === currentRole && <Check className="w-3.5 h-3.5 text-blue-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────
export default function TeamPage() {
  const { activeProject } = useProject();
  const { user } = useAuth();
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Detecta si el usuario actual es Scrum Master.
  // En modo mock no hay coincidencia de email con el backend, así que
  // buscamos por email Y por id, y si ninguno coincide asumimos que
  // el usuario logueado es el líder (para poder probar el flujo).
  const currentMember = members.find(
    (m) => m.email === user?.email || m.user_id === String(user?.id)
  );
  const isScrimMaster = USE_MOCK
    ? (currentMember?.role === "Scrum Master" || !currentMember)
    : currentMember?.role === "Scrum Master";

  const existingMemberIds = members.map((m) => m.user_id);

  // Cambia el rol de un miembro
  const handleRoleChange = async (memberId, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    if (!USE_MOCK) {
      try {
        await apiFetch(`/api/projects/${activeProject?.id}/members/${memberId}/`, {
          method: "PATCH",
          body: JSON.stringify({ role: newRole }),
        });
      } catch {
        // revertir
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: m.role } : m))
        );
      }
    }
  };

  // Agrega miembro al estado local después de invitar (mock)
  const handleInvited = ({ user: invitedUser, role }) => {
    // En modo real esto se vería reflejado cuando el usuario acepte la invitación.
    // En mock, mostramos feedback inmediato.
    console.log(`Invitación enviada a ${invitedUser.first_name} como ${role}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Equipo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeProject?.name} · {members.length} miembro{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isScrimMaster && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invitar miembro
          </button>
        )}
      </div>

      {/* Tabla de miembros */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-0">
          {/* Encabezado */}
          <div className="contents">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Miembro</span>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</span>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Se unió</span>
            </div>
          </div>

          {/* Filas */}
          {members.map((member, idx) => {
            const isLeader = member.role === "Scrum Master";
            return (
              <div key={member.id} className="contents">
                {/* Info del miembro */}
                <div className={`px-5 py-4 flex items-center gap-3 ${idx < members.length - 1 ? "border-b border-slate-100" : ""}`}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {initials(member)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {member.first_name} {member.last_name}
                      {member.user_id === user?.id?.toString() && (
                        <span className="ml-1.5 text-xs text-slate-400 font-normal">(tú)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>

                {/* Rol */}
                <div className={`px-5 py-4 flex items-center ${idx < members.length - 1 ? "border-b border-slate-100" : ""}`}>
                  {isScrimMaster && !isLeader ? (
                    <RoleSelector
                      currentRole={member.role}
                      memberId={member.id}
                      isLeader={isLeader}
                      onRoleChange={handleRoleChange}
                    />
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_STYLES[member.role] || ROLE_STYLES.Observer}`}>
                      {isLeader && <ShieldCheck className="w-3 h-3" />}
                      {member.role}
                    </span>
                  )}
                </div>

                {/* Fecha */}
                <div className={`px-5 py-4 flex items-center ${idx < members.length - 1 ? "border-b border-slate-100" : ""}`}>
                  <span className="text-xs text-slate-400">{formatDate(member.joined_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado vacío */}
      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Users className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No hay miembros en este proyecto todavía</p>
          {isScrimMaster && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Invitar primer miembro
            </button>
          )}
        </div>
      )}

      {/* Modal de invitación */}
      {showInviteModal && (
        <InviteModal
          projectId={activeProject?.id}
          projectName={activeProject?.name}
          existingMemberIds={existingMemberIds}
          onClose={() => setShowInviteModal(false)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}