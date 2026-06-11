import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Layers, LogIn } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          <Layers size={20} color="white" />
        </div>
        <h1 style={{ color: '#0F172A', marginBottom: '6px' }}>Entrar no Orchestra</h1>
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
          Acesse sua conta para continuar no painel.
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

        {(localError || error) && (
          <div className="mt-4 p-3 rounded-xl" style={{ background: '#FEF2F2', color: '#EF4444', fontSize: '12px', lineHeight: 1.5 }}>
            {localError ?? error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '13px', fontWeight: 600 }}
        >
          <LogIn size={14} />
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
