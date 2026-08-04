import { useMemo, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  FileBarChart,
  Filter,
  FlaskConical,
  FolderOpen,
  Instagram,
  LayoutDashboard,
  LayoutTemplate,
  Lock,
  MessageCircle,
  Package,
  Plug,
  Puzzle,
  Receipt,
  Rocket,
  Search,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { MARKETPLACE_MODULES } from '../../services/moduleRegistry';
import type { ModuleDefinition, ModuleStatus } from '../../types';

type MarketplaceModule = ModuleDefinition & { marketplace: NonNullable<ModuleDefinition['marketplace']> };

type CardStatus = ModuleStatus | 'unavailable';

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

const statusConfig: Record<CardStatus, { label: string; color: string; bg: string; icon: ReactNode }> = {
  active: { label: 'Ativo', color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={11} /> },
  available: { label: 'N?o dispon?vel', color: '#64748B', bg: '#F8FAFC', icon: <Lock size={11} /> },
  review: { label: 'Em an?lise', color: '#B45309', bg: '#FFFBEB', icon: <Clock size={11} /> },
  development: { label: 'Em desenvolvimento', color: '#64748B', bg: '#F8FAFC', icon: <Clock size={11} /> },
  blocked: { label: 'Bloqueado', color: '#EF4444', bg: '#FEF2F2', icon: <Lock size={11} /> },
  unavailable: { label: 'Sem superf?cie ativa', color: '#64748B', bg: '#F8FAFC', icon: <Lock size={11} /> },
};

function primaryOperationalRoute(module: ModuleDefinition) {
  if (module.status !== 'active') return null;
  return module.routes?.find(route => !blockedComponentIds.has(route.componentId))?.path ?? null;
}

function visibleStatus(module: ModuleDefinition): CardStatus {
  if (module.status === 'active' && !primaryOperationalRoute(module)) return 'unavailable';
  return module.status;
}

function ModuleCard({ module }: { module: MarketplaceModule }) {
  const navigate = useNavigate();
  const Icon = iconMap[module.icon] || Building2;
  const route = primaryOperationalRoute(module);
  const status = statusConfig[visibleStatus(module)];

  return (
    <div
      data-testid={`module-card-${module.id}`}
      className="bg-white rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer group"
      style={{ border: '1px solid rgba(0,0,0,0.06)' }}
      onClick={() => navigate(`/modules/${module.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: route ? '#EEF2FF' : '#F8FAFC' }}
        >
          <Icon size={20} style={{ color: route ? '#6366F1' : '#64748B' }} />
        </div>
        <span
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: status.bg, color: status.color, fontSize: '10px', fontWeight: 600 }}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h4 style={{ color: '#0F172A', marginBottom: 4 }}>{module.name}</h4>
        <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{module.description}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="px-2 py-1 rounded-md" style={{ background: '#F8FAFC', color: '#64748B', fontSize: 11 }}>
          {module.marketplace.category}
        </span>
        {route ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>Inclu?do</span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>Roadmap</span>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        {route ? (
          <button
            data-testid={`module-open-${module.id}`}
            className="flex-1 px-3 py-2 rounded-lg text-white transition-colors"
            style={{ background: '#6366F1', fontSize: 12, fontWeight: 500 }}
            onClick={event => { event.stopPropagation(); navigate(route); }}
          >
            Abrir
          </button>
        ) : (
          <button
            data-testid={`module-unavailable-${module.id}`}
            className="flex-1 px-3 py-2 rounded-lg"
            style={{ background: '#F8FAFC', color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'not-allowed' }}
            disabled
            onClick={event => event.stopPropagation()}
          >
            N?o dispon?vel
          </button>
        )}
        <button
          className="px-3 py-2 rounded-lg transition-colors"
          style={{ background: '#F8FAFC', color: '#64748B', fontSize: 12 }}
          onClick={event => { event.stopPropagation(); navigate(`/modules/${module.id}`); }}
        >
          Detalhes
        </button>
      </div>
    </div>
  );
}

export function ModulesMarketplace() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const modules = MARKETPLACE_MODULES as MarketplaceModule[];
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(modules.map(module => module.marketplace.category))).sort()], [modules]);

  const filtered = modules.filter(module => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchSearch = !normalizedSearch || module.name.toLowerCase().includes(normalizedSearch) || module.description.toLowerCase().includes(normalizedSearch);
    const matchCat = category === 'Todos' || module.marketplace.category === category;
    const matchStatus = statusFilter === 'Todos' || visibleStatus(module) === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const counts = {
    active: modules.filter(module => Boolean(primaryOperationalRoute(module))).length,
    roadmap: modules.filter(module => !primaryOperationalRoute(module) && module.status !== 'blocked').length,
    blocked: modules.filter(module => module.status === 'blocked').length,
  };

  return (
    <div data-testid="modules-marketplace" className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: 12, color: '#94A3B8' }}>
          <span>Orchestra</span>
          <ChevronRight size={12} />
          <span>M?dulos</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 style={{ color: '#0F172A' }}>M?dulos Orchestra</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Consulte os m?dulos registrados e abra apenas superf?cies produtivas.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Com rota ativa', value: counts.active, color: '#10B981', bg: '#ECFDF5' },
          { label: 'Roadmap', value: counts.roadmap, color: '#64748B', bg: '#F8FAFC' },
          { label: 'Bloqueados', value: counts.blocked, color: '#EF4444', bg: '#FEF2F2' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-4 flex items-center gap-4" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</span>
            </div>
            <span style={{ fontSize: 13, color: '#64748B' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white flex-1" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          <Search size={14} style={{ color: '#94A3B8' }} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar m?dulos..."
            className="bg-transparent flex-1 outline-none"
            style={{ fontSize: 13, color: '#0F172A' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Filter size={16} style={{ color: '#94A3B8', alignSelf: 'center' }} />
          {[
            { value: 'Todos', label: 'Todos' },
            { value: 'active', label: 'Ativos' },
            { value: 'development', label: 'Roadmap' },
            { value: 'blocked', label: 'Bloqueados' },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className="px-3 py-2 rounded-xl transition-colors"
              style={{
                fontSize: 12,
                fontWeight: 500,
                background: statusFilter === item.value ? '#EEF2FF' : 'white',
                color: statusFilter === item.value ? '#6366F1' : '#64748B',
                border: '1px solid',
                borderColor: statusFilter === item.value ? '#C7D2FE' : 'rgba(0,0,0,0.08)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map(item => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className="px-3 py-2 rounded-xl whitespace-nowrap transition-colors"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: category === item ? '#6366F1' : 'white',
              color: category === item ? 'white' : '#64748B',
              border: '1px solid',
              borderColor: category === item ? '#6366F1' : 'rgba(0,0,0,0.08)',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-16 flex flex-col items-center justify-center text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#F1F5F9' }}>
            <Search size={24} style={{ color: '#94A3B8' }} />
          </div>
          <h3 style={{ color: '#0F172A' }}>Nenhum m?dulo encontrado</h3>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Ajuste os filtros ou termos de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(module => <ModuleCard key={module.id} module={module} />)}
        </div>
      )}
    </div>
  );
}
