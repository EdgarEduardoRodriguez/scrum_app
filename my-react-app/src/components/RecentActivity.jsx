import { CheckCircle2, MessageSquare, UserPlus, FileText } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'task_completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    user: 'Miguel Chen',
    action: 'completó',
    target: 'Módulo de Autenticación de Usuario',
    time: 'hace 15 minutos',
  },
  {
    id: 2,
    type: 'comment',
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    user: 'Emma Davis',
    action: 'comentó en',
    target: 'Sprint de Integración API',
    time: 'hace 1 hora',
  },
  {
    id: 3,
    type: 'member_added',
    icon: UserPlus,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    user: 'Sara Johnson',
    action: 'agregó a',
    target: 'Alex Thompson al equipo',
    time: 'hace 2 horas',
  },
  {
    id: 4,
    type: 'document',
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    user: 'David Park',
    action: 'subió',
    target: 'Notas de Retrospectiva del Sprint',
    time: 'hace 3 horas',
  },
  {
    id: 5,
    type: 'task_completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    user: 'Lisa Wong',
    action: 'completó',
    target: 'Diseño del Esquema de Base de Datos',
    time: 'hace 5 horas',
  },
];

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Actividad Reciente</h3>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`${activity.bgColor} ${activity.color} rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold text-[#007BFF]">{activity.user}</span>{' '}
                  <span className="text-slate-600">{activity.action}</span>{' '}
                  <span className="font-medium text-slate-800">{activity.target}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-400"></span>
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <button className="w-full mt-4 py-2.5 text-sm text-white bg-gradient-to-r from-[#007BFF] to-indigo-500 hover:from-[#0056b3] hover:to-indigo-600 rounded-lg transition-all font-semibold shadow-sm hover:shadow-md">
        Ver Toda la Actividad
      </button>
    </div>
  );
}