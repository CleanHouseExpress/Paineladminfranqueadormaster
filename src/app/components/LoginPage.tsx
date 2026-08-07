import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Layers, LogIn } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { useTenant } from '../../shared/hooks/useTenant';
import { useTenantTheme } from '../../shared/context/TenantThemeContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const { tenant, isTenantLoading, tenantExists, tenantError } = useTenant();
  const { branding, isThemeLoading, themeError } = useTenantTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
  const whiteLabel = tenant.whiteLabel;
  const primaryColor = branding.primary_color || whiteLabel.primaryColor || '#6366F1';
  const secondaryColor = branding.secondary_color || whiteLabel.secondaryColor || '#8B5CF6';
  const gradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  const platformName = branding.login_title ?? branding.display_name ?? whiteLabel.platformName;
  const logoUrl = branding.logo ?? whiteLabel.logoUrl;
  const loginBg = branding.authentication_background_image ?? whiteLabel.loginBg;

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  if (isTenantLoading || isThemeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="rounded-2xl p-8 w-full max-w-sm text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <div className="w-12 h-12 rounded-xl mx-auto mb-5 animate-pulse" style={{ background: gradient }} />
          <p style={{ color: 'var(--muted-text)', fontSize: '13px' }}>Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  if (tenantExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="rounded-2xl p-8 w-full max-w-sm text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <div className="text-5xl mb-3" style={{ color: 'var(--text)', fontWeight: 700 }}>404</div>
          <h1 style={{ color: 'var(--text)', marginBottom: '6px' }}>Pagina nao encontrada</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-text)', lineHeight: 1.5 }}>
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
        background: loginBg
          ? `linear-gradient(rgba(248, 250, 252, 0.86), rgba(248, 250, 252, 0.86)), url(${loginBg}) center/cover`
          : 'var(--background)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <form onSubmit={handleSubmit} className="rounded-2xl p-8 w-full max-w-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 overflow-hidden" style={{ background: gradient }}>
          {logoUrl ? (
            <img src={logoUrl} alt={tenant.name} className="w-full h-full object-contain p-1" />
          ) : whiteLabel.logoText ? (
            <span style={{ color: 'var(--primary-foreground)', fontSize: '14px', fontWeight: 700 }}>{whiteLabel.logoText}</span>
          ) : (
            <Layers size={20} color="var(--primary-foreground)" />
          )}
        </div>
        <h1 style={{ color: 'var(--text)', marginBottom: '6px' }}>Entrar no {platformName}</h1>
        <p style={{ fontSize: '13px', color: 'var(--muted-text)', lineHeight: 1.5, marginBottom: '24px' }}>
          {branding.login_subtitle ?? `Acesse sua conta para continuar no painel de ${tenant.name}.`}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block mb-1.5" style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500 }}>E-mail</label>
            <input
              data-testid="login-email"
              required
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              style={{ background: 'var(--background)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block mb-1.5" style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500 }}>Senha</label>
            <input
              data-testid="login-password"
              required
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              style={{ background: 'var(--background)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text)' }}
            />
          </div>
        </div>

        {(localError || error || tenantError || themeError) && (
          <div className="mt-4 p-3 rounded-xl" style={{ background: '#FEF2F2', color: '#EF4444', fontSize: '12px', lineHeight: 1.5 }}>
            {localError ?? error ?? tenantError ?? themeError}
          </div>
        )}

        <button
          data-testid="login-submit"
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: gradient, color: 'var(--primary-foreground)', fontSize: '13px', fontWeight: 600 }}
        >
          <LogIn size={14} />
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
