import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Completadas', value: 68 },
  { name: 'Pendientes', value: 32 },
];

const COLORS = ['#007BFF', '#E2E8F0'];

export default function ProjectProgress() {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md p-6 border-t-4 border-purple-500">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Progreso del Proyecto</h3>
      
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 min-h-[192px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-4xl font-bold text-[#007BFF]">68%</span>
            <span className="text-sm text-slate-600 font-medium">Completado</span>
          </div>
        </div>
        
        <div className="mt-6 w-full space-y-3">
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#007BFF] shadow-sm"></div>
              <span className="text-sm text-slate-700 font-medium">Tareas Completadas</span>
            </div>
            <span className="text-sm font-bold text-[#007BFF]">124</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-300 shadow-sm"></div>
              <span className="text-sm text-slate-700 font-medium">Tareas Pendientes</span>
            </div>
            <span className="text-sm font-bold text-slate-600">58</span>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200">
            <span className="text-sm font-semibold text-slate-700">Total de Tareas</span>
            <span className="text-lg font-bold text-slate-800">182</span>
          </div>
        </div>
      </div>
    </div>
  );
}