import { Clock, CheckCircle2, Circle } from 'lucide-react';

const sprints = [
  {
    id: 1,
    name: 'Sprint 12',
    status: 'En Progreso',
    daysLeft: 5,
    completed: 12,
    total: 18,
  },
  {
    id: 2,
    name: 'Sprint 13',
    status: 'Planificando',
    daysLeft: 12,
    completed: 0,
    total: 15,
  },
];

export default function ActiveSprints() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#007BFF]">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Sprints Activos</h3>
      
      <div className="space-y-4">
        {sprints.map((sprint) => (
          <div key={sprint.id} className="border-2 border-slate-200 rounded-lg p-4 hover:border-[#007BFF] transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-800">{sprint.name}</h4>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${sprint.status === 'En Progreso' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  {sprint.status}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-600 bg-orange-50 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{sprint.daysLeft} días</span>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>Progreso</span>
                <span className="font-semibold">{sprint.completed}/{sprint.total} tareas</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#007BFF] to-indigo-500 h-3 rounded-full transition-all shadow-sm"
                  style={{ width: `${(sprint.completed / sprint.total) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex gap-4 text-sm mt-3">
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">{sprint.completed} Completadas</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded">
                <Circle className="w-4 h-4" />
                <span className="font-medium">{sprint.total - sprint.completed} Pendientes</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}