import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import {
  Clock,
  Search,
  Download,
  ChevronDown,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Link2,
  ToggleLeft,
  ListChecks,
  Paperclip,
  Image,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { mockClientHistory } from '../../data/formBuilderMockData';
import { HistoryEntry, HistoryAction } from '../../../types/formBuilder';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_CONFIG: Record<
  HistoryAction,
  { color: string; bg: string; label: string; icon: React.ReactNode }
> = {
  created: {
    color: '#10B981',
    bg: '#D1FAE5',
    label: 'criou',
    icon: <Plus size={14} />,
  },
  updated: {
    color: '#6366F1',
    bg: '#EDE9FE',
    label: 'atualizou',
    icon: <Pencil size={14} />,
  },
  deleted: {
    color: '#EF4444',
    bg: '#FEE2E2',
    label: 'removeu',
    icon: <Trash2 size={14} />,
  },
  published: {
    color: '#F59E0B',
    bg: '#FEF3C7',
    label: 'publicou',
    icon: <BookOpen size={14} />,
  },
  restored: {
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'restaurou',
    icon: <RefreshCw size={14} />,
  },
  duplicated: {
    color: '#06B6D4',
    bg: '#CFFAFE',
    label: 'duplicou',
    icon: <Copy size={14} />,
  },
};

const FIELD_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type size={12} />,
  textarea: <AlignLeft size={12} />,
  number: <Hash size={12} />,
  currency: <DollarSign size={12} />,
  date: <Calendar size={12} />,
  datetime: <Clock size={12} />,
  email: <Mail size={12} />,
  phone: <Phone size={12} />,
  url: <Link2 size={12} />,
  checkbox: <ToggleLeft size={12} />,
  select: <ChevronDown size={12} />,
  multiselect: <ListChecks size={12} />,
  file: <Paperclip size={12} />,
  image: <Image size={12} />,
};

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `há ${days}d`;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function dateGroupLabel(key: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (key === today) return 'HOJE';
  if (key === yesterday) return 'ONTEM';
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserAvatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function ActionBadge({ action }: { action: HistoryAction }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ValueChip({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'before' | 'after';
}) {
  const isBefore = variant === 'before';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, minWidth: 40 }}>
        {label}
      </span>
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 6,
          backgroundColor: isBefore ? '#FEE2E2' : '#D1FAE5',
          color: isBefore ? '#B91C1C' : '#065F46',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const cfg = ACTION_CONFIG[entry.action];

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {/* Timeline dot */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 10,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: cfg.color,
            border: `2px solid #fff`,
            boxShadow: `0 0 0 2px ${cfg.color}40`,
            flexShrink: 0,
          }}
        />
        <div style={{ width: 2, flex: 1, backgroundColor: '#E5E7EB', minHeight: 24 }} />
      </div>

      {/* Avatar */}
      <UserAvatar name={entry.user} color={cfg.color} />

      {/* Card */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: entry.attribute || entry.version ? 10 : 0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            {entry.user}
          </span>
          <ActionBadge action={entry.action} />
          {entry.fieldLabel && (
            <span style={{ fontSize: 14, color: '#374151' }}>
              campo{' '}
              <span style={{ fontWeight: 600, color: '#0F172A' }}>
                "{entry.fieldLabel}"
              </span>
            </span>
          )}
          <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>
            {formatRelative(entry.timestamp)}
          </span>
        </div>

        {/* Body */}
        {(entry.attribute || entry.version) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entry.attribute && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Atributo:</span>
                <span
                  style={{
                    padding: '1px 8px',
                    borderRadius: 6,
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                >
                  {entry.attribute}
                </span>
              </div>
            )}

            {entry.previousValue !== undefined && entry.newValue !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <ValueChip label="Antes:" value={entry.previousValue} variant="before" />
                <ValueChip label="Depois:" value={entry.newValue} variant="after" />
              </div>
            )}

            {entry.version && entry.action === 'published' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Versão publicada:</span>
                <span
                  style={{
                    padding: '1px 8px',
                    borderRadius: 6,
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  v{entry.version}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {entry.fieldId && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#9CA3AF',
              fontSize: 11,
            }}
          >
            {FIELD_TYPE_ICONS['text']}
            <span style={{ fontFamily: 'monospace' }}>{entry.fieldId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChangeHistory() {
  const { entityId } = useParams<{ entityId: string }>();
  const entityName = 'Clientes';

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<HistoryAction | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return mockClientHistory.filter((entry) => {
      if (search && !entry.user.toLowerCase().includes(search.toLowerCase())) return false;
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
      if (dateFrom && entry.timestamp < dateFrom) return false;
      if (dateTo && entry.timestamp > dateTo + 'T23:59:59Z') return false;
      return true;
    });
  }, [search, actionFilter, dateFrom, dateTo]);

  const visible = filtered.slice(0, visibleCount);

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of visible) {
      const key = toDateKey(entry.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [visible]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 32px',
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#6B7280',
            marginBottom: 12,
          }}
        >
          <Link to="/settings" style={{ color: '#6B7280', textDecoration: 'none' }}>
            Configurações
          </Link>
          <span>/</span>
          <Link to="/settings/form-builder" style={{ color: '#6B7280', textDecoration: 'none' }}>
            Form Builder
          </Link>
          <span>/</span>
          <Link
            to={`/settings/form-builder/${entityId}`}
            style={{ color: '#6B7280', textDecoration: 'none' }}
          >
            {entityName}
          </Link>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>Histórico</span>
        </div>

        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={22} color="#6366F1" />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>
                Histórico de Alterações
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 32px', fontSize: 14, color: '#6B7280' }}>
              {entityName} &middot;{' '}
              <strong>{mockClientHistory.length} alterações</strong> registradas
            </p>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            Exportar
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <Search
            size={15}
            color="#9CA3AF"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Buscar por usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 13,
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Action type filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as HistoryAction | 'all')}
            style={{
              padding: '8px 32px 8px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 13,
              color: '#0F172A',
              backgroundColor: '#fff',
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">Todas as ações</option>
            <option value="created">Criado</option>
            <option value="updated">Atualizado</option>
            <option value="published">Publicado</option>
            <option value="deleted">Excluído</option>
            <option value="restored">Restaurado</option>
            <option value="duplicated">Duplicado</option>
          </select>
          <ChevronDown
            size={14}
            color="#6B7280"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>De</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 13,
              color: '#0F172A',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 13, color: '#6B7280' }}>até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 13,
              color: '#0F172A',
              outline: 'none',
            }}
          />
        </div>

        {(search || actionFilter !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearch('');
              setActionFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
            style={{
              padding: '7px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              backgroundColor: '#fff',
              color: '#6B7280',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: '#6B7280',
            }}
          >
            <Clock size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15 }}>Nenhuma alteração encontrada</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([dateKey, entries]) => (
            <div key={dateKey}>
              {/* Date group label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ height: 1, backgroundColor: '#E5E7EB', flex: 1 }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6B7280',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dateGroupLabel(dateKey)}
                </span>
                <div style={{ height: 1, backgroundColor: '#E5E7EB', flex: 1 }} />
              </div>

              {entries.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ))
        )}

        {/* Load more */}
        {visibleCount < filtered.length && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              style={{
                padding: '10px 28px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Carregar mais ({filtered.length - visibleCount} restantes)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
