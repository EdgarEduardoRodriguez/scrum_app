import TaskCard from './TaskCard';

function KanbanColumn({ title, tasks, count, onAddTask, onSaveTaskStatus, onLogTaskTime, columnStatus, onDropTaskToStatus, canCreateTask = true, canMoveTasks = true, canLogTime = true }) {
  const handleDragOver = (e) => {
    if (!canMoveTasks) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    if (!canMoveTasks) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/task-id");
    if (!taskId || !columnStatus || !onDropTaskToStatus) return;
    onDropTaskToStatus(taskId, columnStatus);
  };

  return (
    <div
      className="bg-card rounded-lg p-4 flex flex-col min-w-[320px] border border-border shadow-sm"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full">
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
            assignedTo={task.assignedTo || task.assigneeName || task.assignee || "Sin asignar"}
            avatarColor={task.avatarColor}
            onSaveTaskStatus={onSaveTaskStatus}
            onLogTime={onLogTaskTime}
            canChangeStatus={canMoveTasks}
            canLogTime={canLogTime}
          />
        ))}
      </div>

       {title === 'Por Hacer' && canCreateTask && (
         <button
           className="mt-4 w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 font-medium"
           onClick={onAddTask}
         >
           <span className="w-4 h-4">+</span>
           <span>Agregar Tarea</span>
         </button>
       )}
    </div>
  );
}

export default KanbanColumn;