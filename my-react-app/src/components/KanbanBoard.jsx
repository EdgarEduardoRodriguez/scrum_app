/**
 * KanbanBoard is a layout/container component.
 *
 * The actual columns & tasks are provided by the page (e.g. KanbanPage)
 * via `children`.
 */
export default function KanbanBoard({ children }) {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Tablero Kanban</h2>
        <p className="text-sm text-slate-500 mt-1">Gestiona tus tareas de forma visual</p>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        {children}
      </div>
    </div>
  );
}