import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Layers, LogIn } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { useTenant } from '../../shared/hooks/useTenant';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const { tenant, isTenantLoading, tenantExists, tenantError } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
  const whiteLabel = tenant.whiteLabel;
  const primaryColor = whiteLabel.primaryColor || '#6366F1';
  const secondaryColor = whiteLabel.secondaryColor || '#8B5CF6';
  const gradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  if (isTenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="w-12 h-12 rounded-xl mx-auto mb-5 animate-pulse" style={{ background: gradient }} />
          <p style={{ color: '#64748B', fontSize: '13px' }}>Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  if (tenantExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="text-5xl mb-3" style={{ color: '#0F172A', fontWeight: 700 }}>404</div>
          <h1 style={{ color: '#0F172A', marginBottom: '6px' }}>Pagina nao encontrada</h1>
          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            A rota que voce acessou nao existe.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      setLocalError('NÃ£o foi possÃ­vel entrar agora.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: whiteLabel.loginBg
          ? `linear-gradient(rgba(248, 250, 252, 0.86), rgba(248, 250, 252, 0.86)), url(${whiteLabel.loginBg}) center/cover`
          : '#F8FAFC',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 overflow-hidden" style={{ background: gradient }}>
          {whiteLabel.logoUrl ? (
            <img src={whiteLabel.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
          ) : whiteLabel.logoText ? (
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>{whiteLabel.logoText}</span>
          ) : (
            <Layers size={20} color="white" />
          )}
        </div>
        <h1 style={{ color: '#0F172A', marginBottom: '6px' }}>Entrar no {whiteLabel.platformName}</h1>
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
          Acesse sua conta para continuar no painel de {tenant.name}.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block mb-1.5" style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', color: '#0F172A' }}
            />
          </div>
          <div>
            <label className="block mb-1.5" style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>Senha</label>
            <input
              required
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', color: '#0F172A' }}
            />
          </div>
        </div>

        {(localError || error || tenantError) && (
          <div className="mt-4 p-3 rounded-xl" style={{ background: '#FEF2F2', color: '#EF4444', fontSize: '12px', lineHeight: 1.5 }}>
            {localError ?? error ?? tenantError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: gradient, fontSize: '13px', fontWeight: 600 }}
        >
          <LogIn size={14} />
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
