import { Navigate, useLocation } from 'react-router';
import { RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { token, isAuthenticated, isLoading, error, hydrateSession, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FAFC' }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#0F172A', marginBottom: '8px' }}>Carregando sessÃ£o</h1>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
            Aguarde enquanto validamos seu acesso.
          </p>
        </div>
      </div>
    );
  }

  if (token && error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FAFC' }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-md" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#0F172A', marginBottom: '8px' }}>SessÃ£o indisponÃ­vel</h1>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => void hydrateSession()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white"
              style={{ background: '#6366F1', fontSize: '13px', fontWeight: 500 }}
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', fontWeight: 500 }}
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
