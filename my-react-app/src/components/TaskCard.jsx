import { useState } from "react";
import TaskStatusModal from "./TaskStatusModal";
import { TaskStatus } from "../types/task";

const priorityStyles = {
  Alta: "bg-red-100 text-red-700 border-red-200",
  Media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Baja: "bg-green-100 text-green-700 border-green-200",
};

function TaskCard({ task, title, priority, assignedTo, avatarColor }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initials = assignedTo
    .split(" ")
    .map(name => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSaveTaskStatus = (taskId, newStatus) => {
    // Aquí deberías implementar la lógica para guardar el nuevo estado de la tarea
    // Por ahora, solo lo mostraremos en consola
    console.log(`Task ${taskId} status updated to: ${newStatus}`);
    // Puedes añadir una llamada a una API o a un gestor de estado aquí
  };

  const handleLogTime = (taskId, hours, note) => {
    // Aquí deberías implementar la lógica para registrar el tiempo
    console.log(`Logged ${hours} hours for task ${taskId}. Note: ${note || "No note"}`);
    // Puedes añadir una llamada a una API o a un gestor de estado aquí
  };

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
      onClick={() => setIsModalOpen(true)}
    >
      <h4 className="text-sm font-medium text-slate-800 mb-3">{title}</h4>
      
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded border font-medium ${priorityStyles[priority]}`}>
          {priority}
        </span>
        
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
      </div>

      <TaskStatusModal
        task={task}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTaskStatus}
        onLogTime={handleLogTime}
      />
    </div>
  );
}

export default TaskCard;