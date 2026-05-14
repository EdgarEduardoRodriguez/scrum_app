import { useEffect, useMemo, useState } from "react";
import { User, ChevronDown } from "lucide-react";
import KanbanBoard from "../components/KanbanBoard";
import KanbanColumn from "../components/KanbanColumn";
import AddTaskModal from "../components/AddTaskModal";
import TaskDetailPanel from "../components/TaskDetailPanel";
import { TaskStatus } from "../types/task";
import { apiFetch } from "../utils/api";
import { useProject } from "../context/ProjectContext";

const mapBackendTask = (t) => ({
  id: String(t.id),
  title: t.title,
  description: t.description || "",
  status: t.status,
  priority: t.priority || "Media",
  assignee: t.assignee,
  assigneeName: t.assignee_name || "Sin asignar",
  avatarColor: t.avatar_color || "#3B82F6",
  createdAt: new Date(t.created_at),
  estimatedHours: t.estimated_hours || 4,
  statusHistory: [],
  timeEntries: (t.time_entries || []).map((e) => ({
    date: new Date(e.date),
    hours: e.hours,
    loggedBy: e.logged_by,
    note: e.note || null,
  })),
});

const getMemberName = (id, members) => {
  if (!id) return "Sin asignar";
  const m = members.find((m) => m.id === Number(id));
  return m ? m.name : "Sin asignar";
};

function KanbanPage() {
  const { activeProject } = useProject();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [backlogTitle, setBacklogTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const backlogTasks = useMemo(() => tasks, [tasks]);

  useEffect(() => {
    if (!activeProject) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTasks() {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setTasks(data.map(mapBackendTask));
        }
      } catch (err) {
        console.error("Error loading tasks:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTasks();
    return () => { cancelled = true; };
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) {
      setProjectMembers([]);
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      try {
        const res = await apiFetch(`/api/auth/projects/${activeProject.id}/`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const members = (data.members || []).map((m) => ({
            id: m.user_id,
            name: `${m.first_name} ${m.last_name}`.trim() || m.username,
            username: m.username,
          }));
          if (!cancelled) setProjectMembers(members);
        }
      } catch (err) {
        console.error("Error loading members:", err);
      }
    }

    loadMembers();
    return () => { cancelled = true; };
  }, [activeProject]);

  const statusLabelStyles = {
    [TaskStatus.TODO]: "bg-slate-100 text-slate-700",
    [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
    [TaskStatus.DONE]: "bg-green-100 text-green-700",
  };

  const priorityPillStyles = {
    Alta: "bg-red-100 text-red-700 border-red-200",
    Media: "bg-amber-100 text-amber-700 border-amber-200",
    Baja: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const priorityTextColors = {
    Alta: "text-red-600",
    Media: "text-amber-600",
    Baja: "text-emerald-600",
  };

  const prioritySelectStyles = {
    Alta: "bg-red-50 border-red-200 text-red-700",
    Media: "bg-amber-50 border-amber-200 text-amber-700",
    Baja: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  const handleSaveTaskStatus = async (taskId, newStatus) => {
    const prevId = taskId.startsWith("local-") ? null : taskId;
    if (prevId && activeProject) {
      await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/${prevId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {});
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId || task.status === newStatus) {
          return task;
        }

        return {
          ...task,
          status: newStatus,
          statusHistory: [
            ...(Array.isArray(task.statusHistory) ? task.statusHistory : []),
            {
              status: newStatus,
              changedAt: new Date(),
              changedBy: "Usuario",
            },
          ],
        };
      })
    );
  };

  const handleLogTaskTime = async (taskId, hours, note) => {
    const prevId = taskId.startsWith("local-") ? null : taskId;
    if (prevId && activeProject) {
      try {
        await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/${prevId}/log-time/`, {
          method: "POST",
          body: JSON.stringify({ hours, note: note || null, logged_by: "Usuario" }),
        });
      } catch (e) {
        console.error("Error logging time:", e);
      }
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        return {
          ...task,
          timeEntries: [
            ...(Array.isArray(task.timeEntries) ? task.timeEntries : []),
            {
              date: new Date(),
              hours,
              loggedBy: "Usuario",
              note: note || null,
            },
          ],
        };
      })
    );
  };

  const handleDropTaskToStatus = (taskId, targetStatus) => {
    handleSaveTaskStatus(taskId, targetStatus);
  };

  const handleAddTask = (data) => {
    const newTaskId = `task-${tasks.length + 1}-${Date.now()}`;
    const newTask = {
      id: newTaskId,
      title: data.title,
      description: "Tarea agregada desde Product Backlog",
      status: TaskStatus.TODO,
      priority: data.priority,
      assignee: data.assignee,
      avatarColor: data.avatarColor,
      createdAt: new Date(),
      statusHistory: [
        { status: TaskStatus.TODO, changedAt: new Date(), changedBy: "System" },
      ],
      estimatedHours: 4,
      timeEntries: [],
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setIsAddModalOpen(false);
  };

  const handleAddBacklogTask = async (e) => {
    e.preventDefault();
    const title = backlogTitle.trim();
    if (!title) return;

    const palette = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

    const newTask = {
      title,
      description: "Tarea agregada desde Product Backlog",
      status: TaskStatus.TODO,
      priority: "Media",
      assignee: null,
      avatar_color: palette[Math.floor(Math.random() * palette.length)],
      estimated_hours: 4,
    };

    if (activeProject) {
      try {
        const res = await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/`, {
          method: "POST",
          body: JSON.stringify(newTask),
        });
        if (res.ok) {
          const created = await res.json();
          setTasks((prevTasks) => [...prevTasks, mapBackendTask(created)]);
        }
      } catch (err) {
        console.error("Error creating task:", err);
      }
    } else {
      const localTask = {
        id: `local-${Date.now()}`,
        ...newTask,
        avatarColor: newTask.avatar_color,
        estimatedHours: newTask.estimated_hours,
        createdAt: new Date(),
        statusHistory: [{ status: TaskStatus.TODO, changedAt: new Date(), changedBy: "Usuario" }],
        timeEntries: [],
      };
      setTasks((prevTasks) => [...prevTasks, localTask]);
    }
    setBacklogTitle("");
    setIsCreating(false);
  };

  const handleBacklogAssigneeChange = async (taskId, assigneeValue) => {
    const prevId = taskId.startsWith("local-") ? null : taskId;
    const newAssignee = assigneeValue ? Number(assigneeValue) : null;
    if (prevId && activeProject) {
      await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/${prevId}/`, {
        method: "PATCH",
        body: JSON.stringify({ assignee: newAssignee }),
      }).catch(() => {});
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, assignee: newAssignee } : task
      )
    );
  };

  const handleBacklogPriorityChange = async (taskId, priorityValue) => {
    const prevId = taskId.startsWith("local-") ? null : taskId;
    if (prevId && activeProject) {
      await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/${prevId}/`, {
        method: "PATCH",
        body: JSON.stringify({ priority: priorityValue }),
      }).catch(() => {});
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, priority: priorityValue } : task))
    );
  };

  const handleUpdateTask = async (taskId, updates) => {
    const prevId = taskId.startsWith("local-") ? null : taskId;
    if (prevId && activeProject) {
      const backendUpdates = {};
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.assignee !== undefined) backendUpdates.assignee = updates.assignee;
      if (updates.priority !== undefined) backendUpdates.priority = updates.priority;
      if (updates.estimatedHours !== undefined) backendUpdates.estimated_hours = updates.estimatedHours;
      await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/${prevId}/`, {
        method: "PATCH",
        body: JSON.stringify(backendUpdates),
      }).catch(() => {});
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  const handleDeleteTask = async (taskId) => {
    const prevId = taskId.startsWith("local-") ? null : taskId;
    if (prevId && activeProject) {
      await apiFetch(`/api/auth/projects/${activeProject.id}/tasks/${prevId}/`, {
        method: "DELETE",
      }).catch(() => {});
    }

    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    setSelectedTaskId(null);
  };

  const todoTasks = tasks.filter((task) => task.status === TaskStatus.TODO);
  const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
  const doneTasks = tasks.filter((task) => task.status === TaskStatus.DONE);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Tareas del Proyecto</h1>

      <div className="flex gap-4 mb-6">
        <section className="flex-1 ml-4 min-h-[420px] rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-10 w-1.5 rounded-full bg-slate-900" />
              <div>
                <h2 className="text-base font-semibold text-foreground leading-tight">Product Backlog</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Lista principal de tareas del proyecto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs text-muted-foreground">Tareas</span>
              <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-1 text-xs font-medium">
                {backlogTasks.length}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="hidden md:grid grid-cols-12 gap-3 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div className="col-span-6">Tarea</div>
            <div className="col-span-2">Responsable</div>
            <div className="col-span-2">Prioridad</div>
            <div className="col-span-2">Estado</div>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Cargando tareas...
              </div>
            ) : backlogTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No hay tareas en backlog todavía.
              </div>
            ) : (
              backlogTasks.map((task) => (
                <div
                  key={`backlog-${task.id}`}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 rounded-xl border px-3 py-3 transition-shadow cursor-pointer ${
                    selectedTaskId === task.id
                      ? "border-slate-400 bg-slate-50 shadow-sm"
                      : "border-slate-200 bg-white hover:shadow-sm"
                  }`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="md:col-span-6">
                    <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                  </div>
                  <div className="md:col-span-2 flex items-center text-sm text-slate-700">
                    <div className="flex items-center gap-2 w-full">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <select
                        className="w-full bg-transparent px-0 py-1 text-xs md:text-sm focus:outline-none cursor-pointer"
                        value={task.assignee || ""}
                        onChange={(e) => handleBacklogAssigneeChange(task.id, e.target.value)}
                      >
                        <option value="">Sin asignar</option>
                        {projectMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <div className="relative inline-flex items-center">
                      <select
                        className={`
                          appearance-none cursor-pointer border-none outline-none
                          text-xs md:text-sm font-semibold rounded-lg
                          pl-2.5 pr-6 py-1
                          ${task.priority === "Alta"  ? "bg-red-50 text-red-700" : ""}
                          ${task.priority === "Media" ? "bg-amber-50 text-amber-700" : ""}
                          ${task.priority === "Baja"  ? "bg-emerald-50 text-emerald-700" : ""}
                        `}
                        value={task.priority}
                        onChange={(e) => handleBacklogPriorityChange(task.id, e.target.value)}
                      >
                        <option value="Alta" style={{ color: "#b91c1c", backgroundColor: "#fef2f2" }}>Alta</option>
                        <option value="Media" style={{ color: "#b45309", backgroundColor: "#fffbeb" }}>Media</option>
                        <option value="Baja" style={{ color: "#047857", backgroundColor: "#ecfdf5" }}>Baja</option>
                      </select>
                      <ChevronDown
                        className={`
                          pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                          ${task.priority === "Alta"  ? "text-red-700" : ""}
                          ${task.priority === "Media" ? "text-amber-700" : ""}
                          ${task.priority === "Baja"  ? "text-emerald-700" : ""}
                        `}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <span className="text-xs md:text-sm font-medium text-slate-700">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4">
            {isCreating ? (
              <form onSubmit={handleAddBacklogTask} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Título de la tarea</label>
                  <input
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Ej. Diseñar dashboard de métricas"
                    value={backlogTitle}
                    onChange={(e) => setBacklogTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setBacklogTitle("");
                        setIsCreating(false);
                      }
                    }}
                    onBlur={() => {
                      if (!backlogTitle.trim()) {
                        setIsCreating(false);
                      }
                    }}
                    autoFocus
                  />
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors"
              >
                + Crear
              </button>
            )}
          </div>
        </div>
      </section>

      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        projectMembers={projectMembers}
      />
    </div>

    <KanbanBoard>
        <KanbanColumn
          title="Por Hacer"
          tasks={todoTasks}
          count={todoTasks.length}
          onAddTask={() => setIsAddModalOpen(true)}
          onSaveTaskStatus={handleSaveTaskStatus}
          onLogTaskTime={handleLogTaskTime}
          columnStatus={TaskStatus.TODO}
          onDropTaskToStatus={handleDropTaskToStatus}
        />
        <KanbanColumn
          title="En Progreso"
          tasks={inProgressTasks}
          count={inProgressTasks.length}
          onAddTask={() => setIsAddModalOpen(true)}
          onSaveTaskStatus={handleSaveTaskStatus}
          onLogTaskTime={handleLogTaskTime}
          columnStatus={TaskStatus.IN_PROGRESS}
          onDropTaskToStatus={handleDropTaskToStatus}
        />
        <KanbanColumn
          title="Hecho"
          tasks={doneTasks}
          count={doneTasks.length}
          onAddTask={() => setIsAddModalOpen(true)}
          onSaveTaskStatus={handleSaveTaskStatus}
          onLogTaskTime={handleLogTaskTime}
          columnStatus={TaskStatus.DONE}
          onDropTaskToStatus={handleDropTaskToStatus}
        />
      </KanbanBoard>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddTask}
      />
    </div>
  );
}

export default KanbanPage;
