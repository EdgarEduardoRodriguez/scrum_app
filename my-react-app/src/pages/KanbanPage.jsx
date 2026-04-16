import { useState } from "react";
import KanbanBoard from "../components/KanbanBoard";
import KanbanColumn from "../components/KanbanColumn";
import { Task, TaskStatus } from "../types/task";

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

  const handleAddTask = () => {
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newTaskId = `task-${tasks.length + 1}`;
    const newTask = {
      id: newTaskId,
      title: `Nueva Tarea ${tasks.length + 1}`,
      description: "Descripción de la nueva tarea.",
      status: TaskStatus.TODO,
      priority: "Media",
      assignee: "Sin asignar",
      avatarColor: randomColor,
      createdAt: new Date(),
      statusHistory: [
        { status: TaskStatus.TODO, changedAt: new Date(), changedBy: "System" },
      ],
      estimatedHours: 4,
      timeEntries: [],
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const todoTasks = tasks.filter((task) => task.status === TaskStatus.TODO);
  const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
  const doneTasks = tasks.filter((task) => task.status === TaskStatus.DONE);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Kanban Board</h1>

      <KanbanBoard>
        <KanbanColumn
          title="Por Hacer"
          tasks={todoTasks}
          count={todoTasks.length}
          onAddTask={handleAddTask}
        />
        <KanbanColumn
          title="En Progreso"
          tasks={inProgressTasks}
          count={inProgressTasks.length}
          onAddTask={handleAddTask}
        />
        <KanbanColumn
          title="Hecho"
          tasks={doneTasks}
          count={doneTasks.length}
          onAddTask={handleAddTask}
        />
      </KanbanBoard>
    </div>
  );
}

export default KanbanPage;
