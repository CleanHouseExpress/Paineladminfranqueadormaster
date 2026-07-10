import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { BarChart3, Inbox, LayoutDashboard, Settings2 } from 'lucide-react';

const navigation = [
  { label: 'Atendimento', path: '/communication/inbox', icon: Inbox },
  { label: 'Dashboard', path: '/communication/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', path: '/communication/analytics', icon: BarChart3 },
  { label: 'Configurações', path: '/communication/settings', icon: Settings2 },
] as const;

function isActive(path: string, currentPath: string) {
  if (path === '/communication/inbox') {
    return currentPath === path || currentPath === '/support';
  }

  return currentPath === path;
}

interface CommunicationAreaShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function CommunicationAreaShell({ children, title, subtitle }: CommunicationAreaShellProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Inbox className="h-4 w-4" />
              Central de Conversas
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title ?? 'Central de Conversas'}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {subtitle ?? 'Area central para atender, acompanhar e configurar as conversas da operacao.'}
            </p>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Subnavegação de comunicação">
            {navigation.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path, currentPath);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
