import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Lock } from 'lucide-react';
import { getModuleByIdOrAlias } from '../../services/moduleRegistry';

export function RequestModuleAccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const module = id ? getModuleByIdOrAlias(id) : undefined;

  return (
    <div className="p-6 max-w-[700px] mx-auto" data-testid="module-request-unavailable">
      <button
        onClick={() => navigate(module ? `/modules/${module.id}` : '/modules')}
        className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
        style={{ fontSize: 13, color: '#64748B' }}
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#F8FAFC' }}>
          <Lock size={24} style={{ color: '#64748B' }} />
        </div>
        <h1 style={{ color: '#0F172A' }}>Solicita??o de acesso indispon?vel</h1>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginTop: 8 }}>
          {module
            ? `O m?dulo ${module.name} n?o possui fluxo de solicita??o publicado na API.`
            : 'Este endere?o n?o possui fluxo de solicita??o publicado na API.'}
        </p>
        <button
          onClick={() => navigate('/modules')}
          className="mt-6 px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: '#6366F1', fontSize: 13, fontWeight: 500 }}
        >
          Ver m?dulos
        </button>
      </div>
    </div>
  );
}
