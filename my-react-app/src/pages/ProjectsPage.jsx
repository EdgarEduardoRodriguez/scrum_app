import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../auth/AuthContext";
import {
  Plus,
  FolderOpen,
  ChevronRight,
  LogOut,
  CheckCircle2,
  Users,
  LayoutDashboard,
  X,
} from "lucide-react";

// Paleta de colores para nuevos proyectos
const COLOR_OPTIONS = [
  "#007BFF", "#7C3AED", "#10B981", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#84CC16",
];

function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      return;
    }
    onCreate({ name: name.trim(), description: description.trim(), color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-1">Nuevo Proyecto</h2>
        <p className="text-sm text-slate-500 mb-6">
          Completa la información para crear tu proyecto Scrum.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Ej: Sistema de Inventario"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿De qué trata este proyecto?"
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color del proyecto
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#1e293b" : "transparent",
                    transform: color === c ? "scale(1.2)" : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors"
              style={{ backgroundColor: color }}
            >
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectCard({ project, onSelect }) {
  const progress = project.tasksTotal > 0
    ? Math.round((project.tasksCompleted / project.tasksTotal) * 100)
    : 0;

  return (
    <button
      onClick={() => onSelect(project)}
      className="group w-full text-left bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 p-6 relative overflow-hidden"
    >
      {/* Barra de color superior */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
        style={{ backgroundColor: project.color }}
      />

      <div className="flex items-start justify-between mb-4 mt-1">
        {/* Ícono y nombre */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
              {project.name}
            </h3>
            <span className="text-xs text-slate-400">{project.role}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors mt-1" />
      </div>

      {/* Descripción */}
      {project.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <LayoutDashboard className="w-3.5 h-3.5" />
          {project.sprintCount} sprints
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {project.tasksCompleted}/{project.tasksTotal} tareas
        </span>
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progreso</span>
          <span className="font-medium" style={{ color: project.color }}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: project.color }}
          />
        </div>
      </div>
    </button>
  );
}

export default function ProjectsPage() {
  const { projects, createProject, selectProject } = useProject();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "Usuario";

  const initials = (() => {
    const parts = fullName.split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  const handleSelect = (project) => {
    selectProject(project);
    navigate("/");
  };

  const handleCreate = (data) => {
    const newProject = createProject(data);
    selectProject(newProject);
    navigate("/");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">ScrumEstudiantes</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Avatar y nombre */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {fullName}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Título y botón nuevo proyecto */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Mis Proyectos</h1>
            <p className="text-slate-500 mt-1">
              Selecciona un proyecto para continuar o crea uno nuevo.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </button>
        </div>

        {/* Grid de proyectos */}
        {projects.length === 0 ? (
          // Estado vacío
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-600 mb-2">
              No tienes proyectos aún
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Crea tu primer proyecto Scrum para comenzar a gestionar tareas y sprints.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear mi primer proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={handleSelect}
              />
            ))}

            {/* Tarjeta de crear nuevo proyecto */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full h-full min-h-[200px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500"
            >
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Nuevo Proyecto</span>
            </button>
          </div>
        )}
      </main>

      {/* Modal de nuevo proyecto */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}