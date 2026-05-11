import { useMemo, useState } from "react";
import { User, ChevronDown } from "lucide-react";
import KanbanBoard from "../components/KanbanBoard";
import KanbanColumn from "../components/KanbanColumn";
import AddTaskModal from "../components/AddTaskModal";
import TaskDetailPanel from "../components/TaskDetailPanel";
import { TaskStatus } from "../types/task";

const mockTasksData = [
  {
    id: "1",
    title: "Diseñar interfaz de usuario para el inicio de sesión",
    description: "Crear una interfaz moderna y responsiva para el formulario de login",
    status: TaskStatus.TODO,
    priority: "Alta",
    assignee: "Juan Pérez",
    avatarColor: "#3B82F6",
    createdAt: new Date("2023-01-01T10:00:00Z"),
    statusHistory: [
      { status: TaskStatus.TODO, changedAt: new Date("2023-01-01T10:00:00Z"), changedBy: "System" },
    ],
    estimatedHours: 8,
    timeEntries: [],
  },
  {
    id: "2",
    title: "Implementar la autenticación de usuarios",
    description: "Desarrollar el sistema de login y registro con JWT",
    status: TaskStatus.IN_PROGRESS,
    priority: "Alta",
    assignee: "María García",
    avatarColor: "#10B981",
    createdAt: new Date("2023-01-05T11:00:00Z"),
    statusHistory: [
      { status: TaskStatus.TODO, changedAt: new Date("2023-01-05T11:00:00Z"), changedBy: "System" },
      { status: TaskStatus.IN_PROGRESS, changedAt: new Date("2023-01-06T09:00:00Z"), changedBy: "Juan Pérez" },
    ],
    estimatedHours: 16,
    timeEntries: [{ date: new Date("2023-01-06T14:00:00Z"), hours: 4, loggedBy: "María García", note: "Initial setup" }],
  },
  {
    id: "3",
    title: "Crear base de datos para productos",
    description: "Diseñar e implementar el esquema de base de datos para el catálogo de productos",
    status: TaskStatus.DONE,
    priority: "Media",
    assignee: "Carlos Ruíz",
    avatarColor: "#F59E0B",
    createdAt: new Date("2023-01-10T14:00:00Z"),
    statusHistory: [
      { status: TaskStatus.TODO, changedAt: new Date("2023-01-10T14:00:00Z"), changedBy: "System" },
      { status: TaskStatus.IN_PROGRESS, changedAt: new Date("2023-01-11T10:00:00Z"), changedBy: "Carlos Ruíz" },
      { status: TaskStatus.DONE, changedAt: new Date("2023-01-13T16:00:00Z"), changedBy: "Carlos Ruíz" },
    ],
    estimatedHours: 12,
    timeEntries: [
      { date: new Date("2023-01-11T15:00:00Z"), hours: 5, loggedBy: "Carlos Ruíz", note: "Table schemas" },
      { date: new Date("2023-01-12T09:00:00Z"), hours: 7, loggedBy: "Carlos Ruíz", note: "Initial data population" },
    ],
  },
  {
    id: "4",
    title: "Desarrollar API para la gestión de pedidos",
    description: "Crear endpoints RESTful para crear, leer, actualizar y eliminar pedidos",
    status: TaskStatus.TODO,
    priority: "Alta",
    assignee: "Ana López",
    avatarColor: "#EF4444",
    createdAt: new Date("2023-01-15T09:00:00Z"),
    statusHistory: [
      { status: TaskStatus.TODO, changedAt: new Date("2023-01-15T09:00:00Z"), changedBy: "System" },
    ],
    estimatedHours: 20,
    timeEntries: [],
  },
  {
    id: "5",
    title: "Optimizar el rendimiento de la aplicación",
    description: "Mejorar los tiempos de carga y reducir el consumo de recursos",
    status: TaskStatus.TODO,
    priority: "Baja",
    assignee: "Pedro Hernández",
    avatarColor: "#8B5CF6",
    createdAt: new Date("2023-01-20T13:00:00Z"),
    statusHistory: [
      { status: TaskStatus.TODO, changedAt: new Date("2023-01-20T13:00:00Z"), changedBy: "System" },
    ],
    estimatedHours: 10,
    timeEntries: [],
  },
];

function KanbanPage() {
  const [tasks, setTasks] = useState(mockTasksData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [backlogTitle, setBacklogTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const backlogTasks = useMemo(() => tasks, [tasks]);

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

  const handleSaveTaskStatus = (taskId, newStatus) => {
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

  const handleLogTaskTime = (taskId, hours, note) => {
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

  const handleAddBacklogTask = (e) => {
    e.preventDefault();
    const title = backlogTitle.trim();
    if (!title) return;

    const palette = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
    const newTask = {
      id: `task-${tasks.length + 1}-${Date.now()}`,
      title,
      description: "Tarea agregada desde Product Backlog",
      status: TaskStatus.TODO,
      priority: "Media",
      assignee: "Sin asignar",
      avatarColor: palette[Math.floor(Math.random() * palette.length)],
      createdAt: new Date(),
      statusHistory: [{ status: TaskStatus.TODO, changedAt: new Date(), changedBy: "Usuario" }],
      estimatedHours: 4,
      timeEntries: [],
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setBacklogTitle("");
    setIsCreating(false);
  };

  const handleBacklogAssigneeChange = (taskId, assigneeValue) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, assignee: assigneeValue.trim() === "" ? "Sin asignar" : assigneeValue }
          : task
      )
    );
  };

  const handleBacklogPriorityChange = (taskId, priorityValue) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, priority: priorityValue } : task))
    );
  };

  const handleUpdateTask = (taskId, updates) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
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
            {backlogTasks.length === 0 ? (
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
                      <User className="w-4 h-4 text-muted-foreground" />
                      <input
                        className="w-full bg-transparent px-0 py-1 text-xs md:text-sm focus:outline-none"
                        value={task.assignee || "Sin asignar"}
                        onChange={(e) => handleBacklogAssigneeChange(task.id, e.target.value)}
                      />
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
