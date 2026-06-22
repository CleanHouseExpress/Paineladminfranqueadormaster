import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FAFC' }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#0F172A', marginBottom: '8px' }}>Carregando sessão</h1>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
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
