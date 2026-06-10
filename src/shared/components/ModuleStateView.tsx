import { Link } from 'react-router';
import {
  Loader2, AlertTriangle, Lock, Clock, Package, ShieldOff,
  Settings, Inbox, RefreshCw, Zap, ArrowRight,
} from 'lucide-react';
import type { ModuleUIState } from '../../types';

interface ModuleStateViewProps {
  state: ModuleUIState;
  moduleName?: string;
  /** Used by 'error' state */
  errorMessage?: string;
  /** Used by 'empty' state */
  emptyHint?: string;
  /** Used by 'no-config' state — where to go to configure */
  configPath?: string;
  /** Used by 'no-permission' — role required */
  requiredRole?: string;
  /** Called by 'error' retry button */
  onRetry?: () => void;
}

interface StateConfig {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function ModuleStateView({
  state,
  moduleName,
  errorMessage,
  emptyHint,
  configPath = '/settings',
  requiredRole = 'Franqueador Master',
  onRetry,
}: ModuleStateViewProps) {
  const name = moduleName ?? 'este módulo';

  const stateConfig: Record<Exclude<ModuleUIState, 'active'>, StateConfig> = {
    loading: {
      icon: <Loader2 size={28} className="animate-spin" />,
      iconBg: '#EEF2FF',
      iconColor: '#6366F1',
      title: 'Carregando…',
      description: 'Aguarde enquanto os dados são carregados.',
    },

    error: {
      icon: <AlertTriangle size={28} />,
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      title: 'Algo deu errado',
      description: errorMessage ?? 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
      action: onRetry ? (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
          style={{ background: '#EF4444', fontSize: '13px', fontWeight: 500 }}
        >
          <RefreshCw size={14} /> Tentar novamente
        </button>
      ) : undefined,
    },

    empty: {
      icon: <Inbox size={28} />,
      iconBg: '#F8FAFC',
      iconColor: '#94A3B8',
      title: 'Nenhum dado encontrado',
      description: emptyHint ?? 'Ainda não há registros aqui. Comece adicionando o primeiro item.',
    },

    available: {
      icon: <Zap size={28} />,
      iconBg: '#EEF2FF',
      iconColor: '#6366F1',
      title: `${name} está disponível`,
      description: 'Este módulo está disponível para ativação na sua rede. Solicite o acesso para começar a usar.',
      action: (
        <Link
          to="/modules"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '13px', fontWeight: 500 }}
        >
          Ver na Central de Módulos <ArrowRight size={14} />
        </Link>
      ),
    },

    blocked: {
      icon: <Lock size={28} />,
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      title: 'Módulo bloqueado',
      description: 'Este módulo está bloqueado pelo plano atual ou por política do franqueador. Entre em contato para saber mais.',
      action: (
        <Link
          to="/settings/billing"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
          style={{ background: '#EF4444', fontSize: '13px', fontWeight: 500 }}
        >
          Ver planos <ArrowRight size={14} />
        </Link>
      ),
    },

    review: {
      icon: <Clock size={28} />,
      iconBg: '#FFFBEB',
      iconColor: '#F59E0B',
      title: 'Solicitação em análise',
      description: 'Sua solicitação de acesso a este módulo está sendo analisada pela equipe. Você será notificado em breve.',
      action: (
        <Link
          to="/access/requests"
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: '#FFFBEB', color: '#F59E0B', border: '1px solid #FCD34D', fontSize: '13px', fontWeight: 500 }}
        >
          Ver solicitações <ArrowRight size={14} />
        </Link>
      ),
    },

    'no-permission': {
      icon: <ShieldOff size={28} />,
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      title: 'Sem permissão',
      description: `Você não tem permissão para acessar ${name}. O perfil necessário é: ${requiredRole}.`,
      action: (
        <Link
          to="/access/requests"
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', fontWeight: 500 }}
        >
          Solicitar acesso <ArrowRight size={14} />
        </Link>
      ),
    },

    'no-config': {
      icon: <Settings size={28} />,
      iconBg: '#FFF7ED',
      iconColor: '#F59E0B',
      title: 'Configuração necessária',
      description: `${name} precisa ser configurado antes de ser utilizado. Complete a configuração para continuar.`,
      action: (
        <Link
          to={configPath}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
          style={{ background: '#F59E0B', fontSize: '13px', fontWeight: 500 }}
        >
          Configurar agora <ArrowRight size={14} />
        </Link>
      ),
    },
  };

  if (state === 'active') return null;

  const config = stateConfig[state];

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: config.iconBg, color: config.iconColor }}
        >
          {config.icon}
        </div>
        <h2 style={{ color: '#0F172A', marginBottom: '8px' }}>{config.title}</h2>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
          {config.description}
        </p>
        {config.action && (
          <div className="flex justify-center">{config.action}</div>
        )}
      </div>
    </div>
  );
}
