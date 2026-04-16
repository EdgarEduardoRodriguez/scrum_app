import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function ComingSoon({ title }) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-600 mb-6">
          Esta sección está en desarrollo. ¡Pronto estará disponible!
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Tablero
        </button>
      </div>
    </div>
  );
}

export default ComingSoon;