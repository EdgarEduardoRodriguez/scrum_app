import TaskCard from './TaskCard';

function KanbanColumn({ title, tasks, count, onAddTask }) {
  return (
    <div className="bg-slate-100 rounded-lg p-4 flex flex-col min-w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      
      <div className="space-y-3 flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            title={task.title}
            priority={task.priority}
            assignedTo={task.assignedTo || task.assignee || "Sin asignar"}
            avatarColor={task.avatarColor}
          />
        ))}
      </div>
      
      <button 
        className="mt-4 w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-[#007BFF] hover:text-[#007BFF] transition-colors flex items-center justify-center gap-2 font-medium"
        onClick={onAddTask}
      >
        <span className="w-4 h-4">+</span>
        <span>Agregar Tarea</span>
      </button>
    </div>
  );
}

export default KanbanColumn;
