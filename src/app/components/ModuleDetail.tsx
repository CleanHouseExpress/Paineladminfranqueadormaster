import { type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  FileBarChart,
  FlaskConical,
  FolderOpen,
  Instagram,
  LayoutDashboard,
  LayoutTemplate,
  Link,
  Lock,
  MessageCircle,
  Package,
  Plug,
  Puzzle,
  Receipt,
  Rocket,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { getModuleByIdOrAlias } from '../../services/moduleRegistry';
import type { ModuleDefinition, ModuleStatus } from '../../types';

type DetailStatus = ModuleStatus | 'unavailable';

const iconMap: Record<string, ComponentType<{ size?: number; style?: CSSProperties }>> = {
  Activity,
  AlertCircle,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileBarChart,
  FlaskConical,
  FolderOpen,
  Instagram,
  LayoutDashboard,
  LayoutTemplate,
  MessageCircle,
  Package,
  Plug,
  Puzzle,
  Receipt,
  Rocket,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
};

const blockedComponentIds = new Set(['reports', 'request-new-module', 'request-module-access', 'inventory-transfers', 'inventory-transfer-detail']);

const statusColors: Record<DetailStatus, { color: string; bg: string; label: string }> = {
  active: { color: '#10B981', bg: '#ECFDF5', label: 'Ativo' },
  available: { color: '#64748B', bg: '#F8FAFC', label: 'N?o dispon?vel' },
  review: { color: '#B45309', bg: '#FFFBEB', label: 'Em an?lise' },
  development: { color: '#64748B', bg: '#F8FAFC', label: 'Em desenvolvimento' },
  blocked: { color: '#EF4444', bg: '#FEF2F2', label: 'Bloqueado' },
  unavailable: { color: '#64748B', bg: '#F8FAFC', label: 'Sem superf?cie ativa' },
};

function primaryOperationalRoute(module: ModuleDefinition) {
  if (module.status !== 'active') return null;
  return module.routes?.find(route => !blockedComponentIds.has(route.componentId))?.path ?? null;
}

function visibleStatus(module: ModuleDefinition): DetailStatus {
  if (module.status === 'active' && !primaryOperationalRoute(module)) return 'unavailable';
  return module.status;
}

function InfoPanel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 style={{ color: '#0F172A' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const module = id ? getModuleByIdOrAlias(id) : undefined;

  if (!module) {
    return (
      <div className="p-6 max-w-[720px] mx-auto">
        <button onClick={() => navigate('/modules')} className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70" style={{ fontSize: 13, color: '#64748B' }}>
          <ArrowLeft size={16} />
          Voltar para M?dulos
        </button>
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#0F172A' }}>M?dulo n?o encontrado</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>O cat?logo n?o possui um m?dulo registrado para este endere?o.</p>
        </div>
      </div>
    );
  }

  const Icon = iconMap[module.icon] || Building2;
  const route = primaryOperationalRoute(module);
  const status = statusColors[visibleStatus(module)];
  const visibleRoutes = module.routes?.filter(item => !blockedComponentIds.has(item.componentId)) ?? [];
  const permissions = module.requiredPermissions ?? Array.from(new Set(visibleRoutes.flatMap(item => item.requiredPermissions ?? [])));

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <button onClick={() => navigate('/modules')} className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70" style={{ fontSize: 13, color: '#64748B' }}>
        <ArrowLeft size={16} />
        Voltar para M?dulos
      </button>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: route ? '#EEF2FF' : '#F8FAFC' }}>
            <Icon size={28} style={{ color: route ? '#6366F1' : '#64748B' }} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 style={{ color: '#0F172A' }}>{module.name}</h1>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: status.bg, color: status.color, fontSize: 12, fontWeight: 600 }}>
                {status.label}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{module.description}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              {module.marketplace?.category && (
                <span className="px-3 py-1 rounded-lg" style={{ background: '#F8FAFC', color: '#64748B', fontSize: 12 }}>
                  {module.marketplace.category}
                </span>
              )}
              <span className="px-3 py-1 rounded-lg" style={{ background: '#F8FAFC', color: '#64748B', fontSize: 12 }}>
                {route ? 'Superf?cie produtiva ativa' : 'Sem ativa??o pela interface'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {route ? (
              <button onClick={() => navigate(route)} className="px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90" style={{ background: '#6366F1', fontSize: 13, fontWeight: 500 }}>
                Abrir m?dulo
              </button>
            ) : (
              <button disabled className="px-5 py-2.5 rounded-xl" style={{ background: '#F8FAFC', color: '#64748B', fontSize: 13, fontWeight: 500, border: '1px solid rgba(0,0,0,0.08)', cursor: 'not-allowed' }}>
                N?o dispon?vel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoPanel icon={<TrendingUp size={16} style={{ color: '#10B981' }} />} title="Estado operacional">
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
            {route
              ? 'Este m?dulo possui rota produtiva registrada no cat?logo da aplica??o.'
              : 'Este m?dulo permanece no cat?logo para transpar?ncia de roadmap, mas n?o possui ativa??o, solicita??o ou execu??o pela interface.'}
          </p>
        </InfoPanel>

        <InfoPanel icon={<Link size={16} style={{ color: '#3B82F6' }} />} title="Rotas registradas">
          {visibleRoutes.length > 0 ? (
            <div className="space-y-2">
              {visibleRoutes.map(item => (
                <div key={`${item.path}-${item.componentId}`} className="px-3 py-2 rounded-lg" style={{ background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 500 }}>
                  {item.path}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#64748B' }}>Nenhuma rota produtiva publicada para este m?dulo.</p>
          )}
        </InfoPanel>

        <InfoPanel icon={<Shield size={16} style={{ color: '#8B5CF6' }} />} title="Permiss?es relacionadas">
          {permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {permissions.map(permission => (
                <span key={permission} className="px-2.5 py-1 rounded-lg" style={{ background: '#F5F3FF', color: '#8B5CF6', fontSize: 12, fontWeight: 500 }}>
                  {permission}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#64748B' }}>Nenhuma permiss?o operacional publicada.</p>
          )}
        </InfoPanel>

        <InfoPanel icon={<Star size={16} style={{ color: '#F59E0B' }} />} title="Cat?logo">
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
            Os dados desta p?gina v?m do registro local de m?dulos usado pela navega??o. Pre?os, prazos e solicita??es n?o s?o exibidos sem contrato de backend.
          </p>
        </InfoPanel>
      </div>
    </div>
  );
}
