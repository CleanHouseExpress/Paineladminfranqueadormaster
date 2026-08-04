import { useNavigate } from 'react-router';
import { ArrowLeft, Lock } from 'lucide-react';

export function RequestNewModule() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[700px] mx-auto" data-testid="new-module-request-unavailable">
      <button
        onClick={() => navigate('/modules')}
        className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
        style={{ fontSize: 13, color: '#64748B' }}
      >
        <ArrowLeft size={16} />
        Voltar para M?dulos
      </button>

      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#F8FAFC' }}>
          <Lock size={24} style={{ color: '#64748B' }} />
        </div>
        <h1 style={{ color: '#0F172A' }}>Solicita??o de novo m?dulo indispon?vel</h1>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginTop: 8 }}>
          Ainda n?o h? endpoint produtivo para registrar sugest?es ou solicita??es de novos m?dulos. A tela foi mantida apenas como bloqueio expl?cito para acessos diretos.
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
