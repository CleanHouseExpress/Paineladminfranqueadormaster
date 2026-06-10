import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  BookOpen,
  Settings,
  Eye,
  History,
  Lock,
  ChevronRight,
  Home,
  Database,
  Users,
  Building2,
  Shield,
  Truck,
  ClipboardCheck,
  MessageCircle,
  Target,
  DollarSign,
  Receipt,
  Package,
  LayoutGrid,
  Layers,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { mockEntities } from '../../data/formBuilderMockData';
import type { FormEntity } from '../../../types/formBuilder';

// ---------------------------------------------------------------------------
// Entity color map
// ---------------------------------------------------------------------------

const ENTITY_COLOR_MAP: Record<string, string> = {
  'entity-clients': '#6366F1',
  'entity-units': '#10B981',
  'entity-users': '#3B82F6',
  'entity-suppliers': '#F59E0B',
  'entity-checklists': '#8B5CF6',
  'entity-support': '#06B6D4',
  'entity-crm': '#EC4899',
  'entity-financial': '#10B981',
  'entity-royalties': '#F59E0B',
  'entity-inventory': '#64748B',
};

// ---------------------------------------------------------------------------
// Lucide icon resolver
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Users,
  Building2,
  Shield,
  Truck,
  ClipboardCheck,
  MessageCircle,
  Target,
  DollarSign,
  Receipt,
  Package,
};

function EntityIcon({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  const Icon = ICON_MAP[name] ?? Database;
  return <Icon size={size} color={color} strokeWidth={2} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
}

function formatLastPublish(entities: FormEntity[]): string {
  const dates = entities
    .filter((e) => e.status === 'active')
    .map((e) => new Date(e.lastModified).getTime());
  if (!dates.length) return '—';
  const latest = new Date(Math.max(...dates));
  return latest.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Stats derived from mock data
// ---------------------------------------------------------------------------

function useCatalogStats(entities: FormEntity[]) {
  return useMemo(() => {
    const totalEntities = entities.length;
    const totalFields = entities.reduce((s, e) => s + e.totalFields, 0);
    const totalCustomFields = entities.reduce((s, e) => s + e.customFields, 0);
    const lastPublish = formatLastPublish(entities);
    return { totalEntities, totalFields, totalCustomFields, lastPublish };
  }, [entities]);
}

// ---------------------------------------------------------------------------
// Unique modules for filter
// ---------------------------------------------------------------------------

function useModuleOptions(entities: FormEntity[]): string[] {
  return useMemo(() => {
    const set = new Set(entities.map((e) => e.module));
    return ['Todos', ...Array.from(set).sort()];
  }, [entities]);
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'active' | 'draft' }) {
  const isActive = status === 'active';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: isActive ? '#DCFCE7' : '#FEF9C3',
        color: isActive ? '#15803D' : '#A16207',
        border: `1px solid ${isActive ? '#BBF7D0' : '#FDE68A'}`,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: isActive ? '#16A34A' : '#CA8A04',
          display: 'inline-block',
        }}
      />
      {isActive ? 'Ativo' : 'Rascunho'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Entity card
// ---------------------------------------------------------------------------

function EntityCard({ entity }: { entity: FormEntity }) {
  const navigate = useNavigate();
  const color = ENTITY_COLOR_MAP[entity.id] ?? '#6366F1';
  const initials = getInitials(entity.lastModifiedBy);
  const systemFields = entity.totalFields - entity.customFields;

  const handleConfigure = () => navigate(`/settings/form-builder/${entity.id}`);
  const handleHistory = () => navigate(`/settings/form-builder/${entity.id}/history`);

  return (
    <article
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 8px 24px rgba(15,23,42,0.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 1px 3px rgba(15,23,42,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Card header with accent color strip */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
        }}
      />

      {/* Card body */}
      <div style={{ padding: '20px 20px 0', flex: 1 }}>
        {/* Icon + name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${color}1A, ${color}35)`,
              border: `1.5px solid ${color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <EntityIcon name={entity.icon} color={color} size={20} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.3,
                }}
              >
                {entity.name}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: color,
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  borderRadius: 6,
                  padding: '1px 6px',
                  letterSpacing: '0.02em',
                }}
              >
                v{entity.currentVersion}
              </span>
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: '#94A3B8',
                fontWeight: 500,
                letterSpacing: '0.03em',
              }}
            >
              {entity.module}
            </p>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 13,
            color: '#64748B',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {entity.description}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          {/* Total fields */}
          <div
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRight: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {entity.totalFields}
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 2, letterSpacing: '0.04em' }}>
              campos
            </div>
          </div>

          {/* Custom fields */}
          <div
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRight: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: color, lineHeight: 1.2 }}>
              {entity.customFields}
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 2, letterSpacing: '0.04em' }}>
              personalizados
            </div>
          </div>

          {/* System fields (locked) */}
          <div style={{ flex: 1, padding: '8px 12px', textAlign: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Lock size={11} color="#CBD5E1" strokeWidth={2.5} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#94A3B8', lineHeight: 1.2 }}>
                {systemFields}
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 2, letterSpacing: '0.04em' }}>
              sistema
            </div>
          </div>
        </div>

        {/* Status + last modified */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <StatusBadge status={entity.status} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Avatar */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${color}, ${color}99)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                flexShrink: 0,
              }}
              title={entity.lastModifiedBy}
            >
              {initials}
            </div>
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
              {formatRelativeDate(entity.lastModified)}
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid #E2E8F0',
          padding: '12px 16px',
          gap: 8,
          background: '#FAFBFC',
        }}
      >
        {/* Configurar — primary */}
        <button
          onClick={handleConfigure}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 8,
            border: 'none',
            background: color,
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          <Settings size={13} strokeWidth={2.5} />
          Configurar
        </button>

        {/* Preview — secondary */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '7px 10px',
            borderRadius: 8,
            border: `1.5px solid #E2E8F0`,
            background: '#FFFFFF',
            color: '#475569',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = color;
            (e.currentTarget as HTMLButtonElement).style.color = color;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
            (e.currentTarget as HTMLButtonElement).style.color = '#475569';
          }}
        >
          <Eye size={13} strokeWidth={2.5} />
          Preview
        </button>

        {/* Histórico — ghost */}
        <button
          onClick={handleHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '7px 10px',
            borderRadius: 8,
            border: '1.5px solid transparent',
            background: 'transparent',
            color: '#94A3B8',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.15s, background 0.15s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#475569';
            (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <History size={13} strokeWidth={2.5} />
          Histórico
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------

function StatPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '12px 18px',
        flex: '1 1 160px',
        minWidth: 140,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: accent ? `${accent}15` : '#F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main catalog
// ---------------------------------------------------------------------------

export function EntityCatalog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [moduleFilter, setModuleFilter] = useState('Todos');

  const stats = useCatalogStats(mockEntities);
  const moduleOptions = useModuleOptions(mockEntities);

  const filtered = useMemo(() => {
    return mockEntities.filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.module.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchModule = moduleFilter === 'Todos' || e.module === moduleFilter;

      return matchSearch && matchStatus && matchModule;
    });
  }, [search, statusFilter, moduleFilter]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 32px',
          }}
        >
          {/* Breadcrumb */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <button
              onClick={() => navigate('/settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: 12,
                fontWeight: 500,
                padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#6366F1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94A3B8')}
            >
              <Home size={12} strokeWidth={2} />
              Configurações
            </button>
            <ChevronRight size={12} color="#CBD5E1" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6366F1' }}>Form Builder</span>
          </nav>

          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingBottom: 20,
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={16} color="#FFFFFF" strokeWidth={2} />
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#0F172A',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Form Builder
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
                <span style={{ color: '#6366F1', fontWeight: 600 }}>Metadata Engine</span>
                {' · '}
                Gerencie a estrutura de dados de toda a plataforma
              </p>
            </div>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 10,
                border: '1.5px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366F1';
                (e.currentTarget as HTMLButtonElement).style.color = '#6366F1';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
                (e.currentTarget as HTMLButtonElement).style.color = '#475569';
              }}
            >
              <BookOpen size={14} strokeWidth={2} />
              Documentação
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Page content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '32px 32px 64px',
        }}
      >
        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          <StatPill
            icon={<LayoutGrid size={18} color="#6366F1" strokeWidth={2} />}
            label="Entidades cadastradas"
            value={stats.totalEntities}
            accent="#6366F1"
          />
          <StatPill
            icon={<Database size={18} color="#3B82F6" strokeWidth={2} />}
            label="Total de campos"
            value={stats.totalFields}
            accent="#3B82F6"
          />
          <StatPill
            icon={<Sparkles size={18} color="#8B5CF6" strokeWidth={2} />}
            label="Campos personalizados"
            value={stats.totalCustomFields}
            accent="#8B5CF6"
          />
          <StatPill
            icon={<CalendarDays size={18} color="#10B981" strokeWidth={2} />}
            label="Última publicação"
            value={stats.lastPublish}
            accent="#10B981"
          />
        </div>

        {/* Search + filters */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 24,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <Search
              size={15}
              color="#94A3B8"
              strokeWidth={2}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar entidade..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: 36,
                paddingRight: 12,
                paddingTop: 9,
                paddingBottom: 9,
                border: '1.5px solid #E2E8F0',
                borderRadius: 10,
                background: '#FFFFFF',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#6366F1')}
              onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'draft')}
            style={{
              padding: '9px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: 10,
              background: '#FFFFFF',
              fontSize: 13,
              color: '#475569',
              fontFamily: 'inherit',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: 32,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="draft">Rascunho</option>
          </select>

          {/* Module filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: 10,
              background: '#FFFFFF',
              fontSize: 13,
              color: '#475569',
              fontFamily: 'inherit',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: 32,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            {moduleOptions.map((m) => (
              <option key={m} value={m}>
                {m === 'Todos' ? 'Todos os módulos' : m}
              </option>
            ))}
          </select>

          {/* Result count */}
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginLeft: 4 }}>
            {filtered.length} de {mockEntities.length} entidades
          </span>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {filtered.map((entity) => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 32px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Search size={24} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
              Nenhuma entidade encontrada
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
              Tente ajustar os filtros ou o termo de busca.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setModuleFilter('Todos');
              }}
              style={{
                marginTop: 20,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1.5px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#6366F1',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
