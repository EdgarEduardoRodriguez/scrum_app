import { useEffect, useMemo, useState, useRef } from "react";
import { User, ChevronDown, Check } from "lucide-react";
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

// ─── Dropdown selector genérico ───────────────────────────────────────────────
function DropdownSelector({
  currentValue,
  options,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
  optionClassName = () => "",
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  const dropdownStyle = () => {
    if (!btnRef.current) return {};
    const r = btnRef.current.getBoundingClientRect();
    return {
      position: "fixed",
      left: `${r.left}px`,
      top: `${r.bottom + 4}px`,
      minWidth: `${r.width}px`,
    };
  };

  const selectedOption = options.find((opt) => opt.value === currentValue);

  return (
    <div className="relative max-w-full">
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:shadow-sm bg-card text-foreground border-border max-w-[110px] ${className}`}
      >
        <span className="truncate min-w-0 flex-1">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60 shrink-0 flex-none" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            style={dropdownStyle()}
            className="bg-card border border-border rounded-lg shadow-lg z-20 py-1 max-h-48 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setOpen(false);
                  if (option.value !== currentValue) onChange(option.value);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors ${optionClassName(option.value)}`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === currentValue && (
                  <Check className="w-3.5 h-3.5 text-[#007BFF] shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KanbanPage() {
  const { activeProject } = useProject();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [backlogTitle, setBacklogTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);

  // Rol del usuario en el proyecto actual (normalizado a minúsculas)
  const userRole = (activeProject?.role || "Developer").toLowerCase();

  // Definir grupos de roles
  const FULL_EDIT_ROLES = ["scrum master", "product owner"];
  const TASK_MOVEMENT_ROLES = ["scrum master", "product owner", "developer", "tester"]; // quiénes pueden mover tareas
  const TIME_LOGGING_ROLES = ["scrum master", "product owner", "developer", "tester"]; // quiénes pueden registrar tiempo

  // Permisos
  const canEdit = FULL_EDIT_ROLES.includes(userRole);
  const canCreateTask = canEdit;
  const canChangePriority = canEdit;
  const canChangeAssignee = canEdit;
  const canMoveTasks = TASK_MOVEMENT_ROLES.includes(userRole);
  const canLogTime = TIME_LOGGING_ROLES.includes(userRole);

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
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
  }, [activeProject]);

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
        if (task.id !== taskId || task.status === newStatus) return task;
        return {
          ...task,
          status: newStatus,
          statusHistory: [
            ...(Array.isArray(task.statusHistory) ? task.statusHistory : []),
            { status: newStatus, changedAt: new Date(), changedBy: "Usuario" },
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
        if (task.id !== taskId) return task;
        return {
          ...task,
          timeEntries: [
            ...(Array.isArray(task.timeEntries) ? task.timeEntries : []),
            { date: new Date(), hours, loggedBy: "Usuario", note: note || null },
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
      statusHistory: [{ status: TaskStatus.TODO, changedAt: new Date(), changedBy: "System" }],
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
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, priority: priorityValue } : task
      )
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
          {/* ── Header ── */}
          <div className="px-5 py-4 border-b border-border bg-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-1.5 rounded-full bg-slate-900" />
                <div>
                  <h2 className="text-base font-semibold text-foreground leading-tight">
                    Product Backlog
                  </h2>
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

          {/* ── Tabla ── */}
          <div className="p-4">
            {/* Headers - Hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
              <div className="col-span-6">Tarea</div>
              <div className="col-span-2 text-center">Responsable</div>
              <div className="col-span-2 text-center">Prioridad</div>
              <div className="col-span-2 text-center">Estado</div>
            </div>

            <div className="space-y-3 mt-3">
              {loading ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
                  <div className="animate-pulse">Cargando tareas...</div>
                </div>
              ) : backlogTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
                  No hay tareas en backlog todavía.
                </div>
              ) : (
                backlogTasks.map((task) => (
                  <div
                    key={`backlog-${task.id}`}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 rounded-xl border px-4 py-4 transition-all cursor-pointer hover:shadow-md ${
                      selectedTaskId === task.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    {/* Título - Mobile: full width, Desktop: col-span-6 */}
                    <div className="md:col-span-6 flex items-center">
                      <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                    </div>

                    {/* Responsable - Mobile: label + content, Desktop: centered */}
                    <div className="md:col-span-2 flex items-center justify-center">
                      <div className="flex items-center gap-2 w-full md:justify-center">
                        <span className="text-xs text-muted-foreground md:hidden">Responsable:</span>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 md:flex-none">
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                          {canChangeAssignee ? (
                            <DropdownSelector
                              currentValue={task.assignee || ""}
                              options={[
                                { label: "Sin asignar", value: "" },
                                ...projectMembers.map((m) => ({ label: m.name, value: m.id })),
                              ]}
                              onChange={(value) => handleBacklogAssigneeChange(task.id, value)}
                              placeholder="Sin asignar"
                              className="flex-1 md:w-auto"
                            />
                          ) : (
                            <span className="text-sm truncate flex-1 md:w-auto">
                              {task.assigneeName || "Sin asignar"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                     {/* Prioridad - Mobile: label + content, Desktop: centered */}
                     <div className="md:col-span-2 flex items-center justify-center">
                       <div className="flex items-center gap-2 w-full md:justify-center">
                         <span className="text-xs text-muted-foreground md:hidden">Prioridad:</span>
                         {canChangePriority ? (
                           <DropdownSelector
                             currentValue={task.priority}
                             options={[
                               { label: "Alta", value: "Alta" },
                               { label: "Media", value: "Media" },
                               { label: "Baja", value: "Baja" },
                             ]}
                             onChange={(value) => handleBacklogPriorityChange(task.id, value)}
                             className={`font-semibold flex-1 md:w-auto
                               ${task.priority === "Alta"  ? "bg-red-50    text-red-700    border-red-200"    : ""}
                               ${task.priority === "Media" ? "bg-amber-50  text-amber-700  border-amber-200"  : ""}
                               ${task.priority === "Baja"  ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                             `}
                             optionClassName={(value) => {
                               if (value === "Alta")  return "text-red-700    hover:bg-red-50";
                               if (value === "Media") return "text-amber-700  hover:bg-amber-50";
                               if (value === "Baja")  return "text-emerald-700 hover:bg-emerald-50";
                               return "";
                             }}
                           />
                         ) : (
                           <span className={`font-semibold px-2.5 py-1 rounded-lg text-xs border
                             ${task.priority === "Alta"  ? "bg-red-50 text-red-700 border-red-200"    : ""}
                             ${task.priority === "Media" ? "bg-amber-50 text-amber-700 border-amber-200"  : ""}
                             ${task.priority === "Baja"  ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                           `}>
                             {task.priority}
                           </span>
                         )}
                       </div>
                     </div>

                    {/* Estado - Mobile: label + content, Desktop: centered */}
                    <div className="md:col-span-2 flex items-center justify-center">
                      <div className="flex items-center gap-2 w-full md:justify-center">
                        <span className="text-xs text-muted-foreground md:hidden">Estado:</span>
                        <span
                          className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap
                            ${task.status === TaskStatus.TODO        ? "bg-slate-100  text-slate-700"  : ""}
                            ${task.status === TaskStatus.IN_PROGRESS ? "bg-blue-100   text-blue-700"   : ""}
                            ${task.status === TaskStatus.DONE        ? "bg-emerald-100 text-emerald-700" : ""}
                          `}
                        >
                          {task.status === TaskStatus.TODO        && "Por Hacer"}
                          {task.status === TaskStatus.IN_PROGRESS && "En Progreso"}
                          {task.status === TaskStatus.DONE        && "Hecho"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Crear tarea ── */}
          <div className="mt-4">
            {canCreateTask ? (
              isCreating ? (
                <form onSubmit={handleAddBacklogTask} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Título de la tarea</label>
                    <input
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <button
                    type="submit"
                    disabled={!backlogTitle.trim()}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Crear
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-black transition-colors"
                >
                  + Crear tarea
                </button>
              )
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Solo Scrum Masters y Product Owners pueden crear tareas
              </p>
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
        userRole={userRole}
      />
      </div>

      {/* ── Kanban Board ── */}
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
            canCreateTask={canCreateTask}
            canMoveTasks={canMoveTasks}
            canLogTime={canLogTime}
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
            canCreateTask={canCreateTask}
            canMoveTasks={canMoveTasks}
            canLogTime={canLogTime}
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
            canCreateTask={canCreateTask}
            canMoveTasks={canMoveTasks}
            canLogTime={canLogTime}
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