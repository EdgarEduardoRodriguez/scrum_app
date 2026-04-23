import { useState, useEffect } from "react";
import { UserPlus, ShieldCheck, ChevronDown, Check, Users } from "lucide-react";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../auth/AuthContext";
import InviteModal from "../components/InviteModal";

const ROLE_OPTIONS = ["Developer", "Tester", "Product Owner", "Observer"];

const ROLE_STYLES = {
  "Scrum Master":  "bg-red-50 text-red-700 border-red-200",
  Developer:       "bg-blue-50 text-[#007BFF] border-blue-200",
  Tester:          "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Product Owner": "bg-purple-50 text-purple-700 border-purple-200",
  Observer:        "bg-muted text-muted-foreground border-border",
};

const AVATAR_COLORS = ["#007BFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(parseInt(String(id).replace(/\D/g, "") || "0", 10)) % AVATAR_COLORS.length];
}
function initials(m) {
  return `${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// Clave donde TeamPage guarda los miembros de cada proyecto
function membersKey(projectId) {
  return `scrum_project_members_${projectId}`;
}

// Lee miembros del localStorage para un proyecto
function loadMembers(projectId) {
  try {
    const raw = localStorage.getItem(membersKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Guarda miembros en localStorage
function saveMembers(projectId, members) {
  try {
    localStorage.setItem(membersKey(projectId), JSON.stringify(members));
  } catch { /* silencioso */ }
}

// ─── Selector de rol inline ───────────────────────────────────────────────
function RoleSelector({ currentRole, memberId, onRoleChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${
          ROLE_STYLES[currentRole] || ROLE_STYLES.Observer
        }`}
      >
        {currentRole}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                onClick={() => { setOpen(false); if (role !== currentRole) onRoleChange(memberId, role); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                {role}
                {role === currentRole && <Check className="w-3.5 h-3.5 text-[#007BFF]" />}
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
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Cargar miembros al montar o cambiar de proyecto
  useEffect(() => {
    if (!activeProject?.id) return;

    const stored = loadMembers(activeProject.id);
    if (stored) {
      setMembers(stored);
    } else if (user) {
      // Primera vez: el creador del proyecto es Scrum Master
      const initialMembers = [{
        id: String(user.id),
        user_id: String(user.id),
        first_name: user.first_name || "Usuario",
        last_name: user.last_name || "",
        email: user.email || user.username || "",
        role: "Scrum Master",
        joined_at: new Date().toISOString(),
      }];
      setMembers(initialMembers);
      saveMembers(activeProject.id, initialMembers);
    }
  }, [activeProject?.id, user]);

  // Revisar si el usuario aceptó alguna invitación pendiente (para mostrarlo en la lista)
  useEffect(() => {
    if (!activeProject?.id || !user) return;
    const JOINED_KEY = `scrum_joined_projects_${user.id}`;
    try {
      const joined = JSON.parse(localStorage.getItem(JOINED_KEY) || "[]");
      const match = joined.find((j) => j.project_id === activeProject.id);
      if (match) {
        setMembers((prev) => {
          const alreadyIn = prev.find((m) => m.user_id === String(user.id));
          if (alreadyIn) return prev;
          const updated = [...prev, {
            id: String(user.id),
            user_id: String(user.id),
            first_name: user.first_name || "Usuario",
            last_name: user.last_name || "",
            email: user.email || user.username || "",
            role: match.role,
            joined_at: match.joined_at,
          }];
          saveMembers(activeProject.id, updated);
          return updated;
        });
      }
    } catch { /* silencioso */ }
  }, [activeProject?.id, user]);

  // ¿El usuario actual es Scrum Master de este proyecto?
  const currentMember = members.find((m) => m.user_id === String(user?.id));
  const isScrumMaster = currentMember?.role === "Scrum Master";

  const existingMemberIds = members.map((m) => m.user_id);

  const handleRoleChange = (memberId, newRole) => {
    setMembers((prev) => {
      const updated = prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m);
      saveMembers(activeProject.id, updated);
      return updated;
    });
  };

  // Cuando se envía la invitación, agregar al miembro provisionalmente
  // (en la realidad aparece hasta que acepta; aquí lo mostramos como "pendiente")
  const handleInvited = ({ user: invitedUser, role }) => {
    // Solo mostramos feedback visual; el miembro aparece cuando acepta en sus notificaciones
    console.log(`Invitación enviada a ${invitedUser.first_name} como ${role}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeProject?.name} · {members.length} miembro{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isScrumMaster && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#007BFF] hover:bg-[#0056b3] text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invitar miembro
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Encabezados */}
        <div className="grid grid-cols-[1fr_auto_auto] bg-muted border-b border-border">
          <div className="px-5 py-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Miembro</span>
          </div>
          <div className="px-5 py-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rol</span>
          </div>
          <div className="px-5 py-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Se unió</span>
          </div>
        </div>

        {/* Filas */}
        {members.map((member, idx) => {
          const isLeader = member.role === "Scrum Master";
          const isMe = member.user_id === String(user?.id);
          const isLast = idx === members.length - 1;
          return (
            <div key={member.id} className={`grid grid-cols-[1fr_auto_auto] ${!isLast ? "border-b border-border" : ""}`}>
              {/* Info */}
              <div className="px-5 py-4 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(member.user_id) }}
                >
                  {initials(member)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {member.first_name} {member.last_name}
                    {isMe && (
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">(tú)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>

              {/* Rol */}
              <div className="px-5 py-4 flex items-center">
                {isScrumMaster && !isLeader ? (
                  <RoleSelector
                    currentRole={member.role}
                    memberId={member.id}
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
              <div className="px-5 py-4 flex items-center">
                <span className="text-xs text-muted-foreground">{formatDate(member.joined_at)}</span>
              </div>
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay miembros todavía</p>
          </div>
        )}
      </div>

      {/* Modal */}
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