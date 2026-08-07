import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <div className="rounded-2xl p-8 text-center max-w-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h1 style={{ color: 'var(--text)', marginBottom: '8px' }}>Carregando sessao</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted-text)', lineHeight: 1.6 }}>
            Aguarde enquanto validamos seu acesso.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
