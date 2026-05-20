import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  ListTodo,
  Play,
  GripVertical,
  X,
} from "lucide-react";
import { useProject } from "../context/ProjectContext";
import { apiFetch } from "../utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

const DIFFICULTY = { Alta: 3, Media: 2, Baja: 1 };

const PRIORITY_STYLES = {
  Alta: "bg-red-50 text-red-700 border-red-200",
  Media: "bg-amber-50 text-amber-700 border-amber-200",
  Baja: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_STYLES = {
  Planificando: "bg-yellow-50 text-yellow-700 border-yellow-200",
  "En Progreso": "bg-blue-50 text-[#007BFF] border-blue-200",
  Completado: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_ICONS = {
  Planificando: AlertCircle,
  "En Progreso": Play,
  Completado: CheckCircle2,
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function SprintPage() {
  const { activeProject } = useProject();
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [loadingBacklog, setLoadingBacklog] = useState(true);
  const [loadingSprints, setLoadingSprints] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", goal: "", startDate: "", endDate: "",
  });

  // ── Fetch sprints from backend ─────────────────────────────────
  const fetchSprints = useCallback(async () => {
    if (!activeProject) {
      setSprints([]);
      setLoadingSprints(false);
      return;
    }
    try {
      setLoadingSprints(true);
      const res = await apiFetch(`/api/auth/projects/${activeProject.id}/sprints/`);
      if (res.ok) {
        const data = await res.json();
        setSprints(data);
      }
    } catch (err) {
      console.error("Error loading sprints:", err);
    } finally {
      setLoadingSprints(false);
    }
  }, [activeProject]);

  // ── Fetch backlog tasks from backend ───────────────────────────
  const fetchBacklogTasks = useCallback(async () => {
    if (!activeProject) {
      setBacklogTasks([]);
      setLoadingBacklog(false);
      return;
    }
    try {
      setLoadingBacklog(true);
      const res = await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/`);
      if (res.ok) {
        const data = await res.json();
        setBacklogTasks(
          data.map((t) => ({
            id: String(t.id),
            title: t.title,
            priority: t.priority || "Media",
          }))
        );
      }
    } catch (err) {
      console.error("Error loading backlog tasks:", err);
    } finally {
      setLoadingBacklog(false);
    }
  }, [activeProject]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);
  useEffect(() => { fetchBacklogTasks(); }, [fetchBacklogTasks]);

  // ── Derived state: tasks of the selected sprint ────────────────
  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);
  const currentTasks = selectedSprint?.tasks || [];

  // ── Form helpers ───────────────────────────────────────────────
  const resetForm = () => {
    setForm({ name: "", goal: "", startDate: "", endDate: "" });
    setEditingSprint(null);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = () => {
    if (!selectedSprint) return;
    setForm({
      name: selectedSprint.name,
      goal: selectedSprint.goal || "",
      startDate: selectedSprint.startDate || "",
      endDate: selectedSprint.endDate || "",
    });
    setEditingSprint(selectedSprint);
    setShowModal(true);
  };

  // ── Create / Update sprint ─────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !activeProject) return;
    setSaving(true);
    try {
      if (editingSprint) {
        const res = await apiFetch(`/api/auth/projects/${activeProject.id}/sprints/${editingSprint.id}/`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = await res.json();
          setSprints((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }
      } else {
        const res = await apiFetch(`/api/auth/projects/${activeProject.id}/sprints/`, {
          method: "POST",
          body: JSON.stringify({ ...form, status: "Planificando" }),
        });
        if (res.ok) {
          const created = await res.json();
          setSprints((prev) => [...prev, created]);
          setSelectedSprintId(created.id);
        }
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving sprint:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete sprint ──────────────────────────────────────────────
  const handleDelete = async (sprintId) => {
    if (!confirm("¿Estás seguro de eliminar este sprint?") || !activeProject) return;
    try {
      const res = await apiFetch(`/api/auth/projects/${activeProject.id}/sprints/${sprintId}/`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setSprints((prev) => prev.filter((s) => s.id !== sprintId));
        if (selectedSprintId === sprintId) setSelectedSprintId(null);
      }
    } catch (err) {
      console.error("Error deleting sprint:", err);
    }
  };

  // ── Change status (Planificando → En Progreso → Completado) ──
  const handleStatusChange = async (sprint) => {
    if (!activeProject) return;
    const cycle = { Planificando: "En Progreso", "En Progreso": "Completado", Completado: "Planificando" };
    const newStatus = cycle[sprint.status];
    try {
      const res = await apiFetch(`/api/auth/projects/${activeProject.id}/sprints/${sprint.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSprints((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
    } catch (err) {
      console.error("Error changing sprint status:", err);
    }
  };

  // ── Drag & drop: add task to sprint ────────────────────────────
  const handleDropOnSprint = async (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId || !selectedSprintId || !activeProject) return;

    try {
      const res = await apiFetch(
        `/api/auth/projects/${activeProject.id}/sprints/${selectedSprintId}/tasks/${taskId}/`,
        { method: "POST" }
      );
      if (res.ok) {
        const updatedSprint = await res.json();
        setSprints((prev) => prev.map((s) => (s.id === updatedSprint.id ? updatedSprint : s)));
      }
    } catch (err) {
      console.error("Error adding task to sprint:", err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "copy";
  };

  // ── Remove task from sprint ────────────────────────────────────
  const removeTaskFromSprint = async (sprintId, taskId) => {
    if (!activeProject) return;
    try {
      const res = await apiFetch(
        `/api/auth/projects/${activeProject.id}/sprints/${sprintId}/tasks/${taskId}/`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const updatedSprint = await res.json();
        setSprints((prev) => prev.map((s) => (s.id === updatedSprint.id ? updatedSprint : s)));
      }
    } catch (err) {
      console.error("Error removing task from sprint:", err);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────
  const stats = {
    total: sprints.length,
    active: sprints.filter((s) => s.status === "En Progreso").length,
    completed: sprints.filter((s) => s.status === "Completado").length,
  };

  const cycle = { Planificando: "En Progreso", "En Progreso": "Completado", Completado: "Planificando" };

  // ── Helpers ────────────────────────────────────────────────────
  const CycleIcon = ({ status }) => {
    const icons = { Planificando: Play, "En Progreso": CheckCircle2, Completado: AlertCircle };
    const colors = { Planificando: "text-[#007BFF]", "En Progreso": "text-green-600", Completado: "text-yellow-500" };
    const Icon = icons[status] || Play;
    return <Icon className={`w-4 h-4 ${colors[status] || ""}`} />;
  };

  const isTaskInSprint = (taskId) => currentTasks.some((t) => String(t.task_id) === String(taskId));

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeProject?.name || "Selecciona un proyecto"}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo sprint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, icon: Calendar, color: "text-primary", bg: "bg-muted" },
          { label: "Activos", value: stats.active, icon: Play, color: "text-[#007BFF]", bg: "bg-blue-50" },
          { label: "Completados", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color} ${stat.bg} p-1.5 rounded-lg`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sprint Selector */}
      {loadingSprints ? (
        <div className="text-sm text-muted-foreground py-2 animate-pulse">Cargando sprints...</div>
      ) : sprints.length > 0 ? (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
            Sprints:
          </span>
          {sprints.map((sprint) => {
            const isActive = sprint.id === selectedSprintId;
            const Icon = STATUS_ICONS[sprint.status] || AlertCircle;
            return (
              <button
                key={sprint.id}
                onClick={() => setSelectedSprintId(sprint.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                <Icon className="w-3 h-3" />
                {sprint.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Split Panel */}
      {selectedSprint ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Product Backlog */}
          <section className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-slate-900" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground leading-tight">
                      Product Backlog
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Arrastra tareas al sprint
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-1 text-xs font-medium">
                  {backlogTasks.length}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
              {loadingBacklog ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
                  <div className="animate-pulse">Cargando tareas...</div>
                </div>
              ) : backlogTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
                  No hay tareas en el backlog.
                </div>
              ) : (
                backlogTasks.map((task) => {
                  const inSprint = isTaskInSprint(task.id);
                  return (
                    <div
                      key={task.id}
                      draggable={!inSprint}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                        inSprint
                          ? "border-emerald-200 bg-emerald-50/50 opacity-60 cursor-not-allowed"
                          : "border-border bg-card hover:border-[#007BFF] hover:shadow-sm cursor-grab active:cursor-grabbing"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${inSprint ? "text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[task.priority]}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-muted-foreground">{DIFFICULTY[task.priority]} pts dificultad</span>
                        </div>
                      </div>
                      {inSprint && (
                        <span className="text-xs text-emerald-600 font-medium shrink-0">En sprint</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* RIGHT: Sprint Tasks (Drop Zone) */}
          <section
            onDrop={handleDropOnSprint}
            onDragOver={handleDragOver}
            className={`bg-card rounded-xl border-2 transition-all overflow-hidden ${
              currentTasks.length === 0
                ? "border-dashed border-muted-foreground/30"
                : "border-border"
            }`}
          >
            {/* Sprint header */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-1 rounded-full"
                    style={{
                      backgroundColor:
                        selectedSprint.status === "Completado" ? "#10B981"
                        : selectedSprint.status === "En Progreso" ? "#007BFF"
                        : "#F59E0B",
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground leading-tight">
                        {selectedSprint.name}
                      </h2>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        STATUS_STYLES[selectedSprint.status] || STATUS_STYLES.Planificando
                      }`}>
                        <StatusIcon status={selectedSprint.status} />
                        {selectedSprint.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(selectedSprint.startDate)} — {formatDate(selectedSprint.endDate)}
                      {selectedSprint.goal && ` · ${selectedSprint.goal}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusChange(selectedSprint)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title={`Cambiar a ${cycle[selectedSprint.status]}`}
                  >
                    <CycleIcon status={selectedSprint.status} />
                  </button>
                  <button
                    onClick={openEditModal}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSprint.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ListTodo className="w-3 h-3" />
                  {currentTasks.length} tarea{currentTasks.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  {currentTasks.reduce((s, t) => s + DIFFICULTY[t.task_priority], 0)} pts dificultad
                </span>
              </div>
            </div>

            {/* Drop zone */}
            <div className="p-3 min-h-[300px] space-y-2 max-h-[500px] overflow-y-auto">
              {currentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">Sprint vacío</p>
                  <p className="text-xs mt-1 text-center max-w-xs">
                    Arrastra tareas desde el Product Backlog para planificar este sprint
                  </p>
                </div>
              ) : (
                currentTasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow group"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{st.task_title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[st.task_priority]}`}>
                          {st.task_priority}
                        </span>
                        <span className="text-xs text-muted-foreground">{DIFFICULTY[st.task_priority]} pts dificultad</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTaskFromSprint(selectedSprintId, st.task_id)}
                      className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-destructive transition-all"
                      title="Quitar del sprint"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border">
          {loadingSprints ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="animate-pulse">Cargando sprints...</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay sprints todavía</p>
              <button
                onClick={openCreateModal}
                className="mt-3 text-sm text-[#007BFF] hover:underline font-medium"
              >
                Crear el primer sprint
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); resetForm(); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSprint ? "Editar sprint" : "Nuevo sprint"}</DialogTitle>
              <DialogDescription>
                {editingSprint ? "Modifica los datos del sprint" : "Define un nuevo sprint para tu proyecto"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del sprint</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Sprint 1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo del sprint</Label>
                <Textarea id="goal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Describe el objetivo de este sprint..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editingSprint ? "Guardar cambios" : "Crear sprint"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusIcon({ status }) {
  const Icon = STATUS_ICONS[status] || AlertCircle;
  return <Icon className="w-3 h-3" />;
}