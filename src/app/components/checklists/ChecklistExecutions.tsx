import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  PlayCircle, Eye, CheckCircle, XCircle, ClipboardList, Search,
  ChevronDown,
} from 'lucide-react';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { mockChecklistExecutions } from '../../data/checklistMockData';
import type { ExecutionStatus, ChecklistExecution } from '../../../types/checklist';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExecutionStatus, { label: string; color: string; bg: string }> = {
  draft:       { label: 'Rascunho',     color: '#64748B', bg: '#F1F5F9' },
  in_progress: { label: 'Em andamento', color: '#2563EB', bg: '#DBEAFE' },
  completed:   { label: 'Concluída',    color: '#059669', bg: '#D1FAE5' },
  approved:    { label: 'Aprovada',     color: '#7C3AED', bg: '#EDE9FE' },
  cancelled:   { label: 'Cancelada',    color: '#DC2626', bg: '#FEE2E2' },
};

const STATUS_TABS: { value: 'all' | ExecutionStatus; label: string }[] = [
  { value: 'all',         label: 'Todas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed',   label: 'Concluídas' },
  { value: 'approved',    label: 'Aprovadas' },
  { value: 'draft',       label: 'Rascunho' },
];

const UNITS = Array.from(new Set(mockChecklistExecutions.map(e => e.unitName))).sort();
const TEMPLATES = Array.from(new Set(mockChecklistExecutions.map(e => e.templateName))).sort();

// ─── Helper ───────────────────────────────────────────────────────────────────

function scoreColor(score?: number): string {
  if (score === undefined || score === null) return '#94A3B8';
  if (score >= 90) return '#16A34A';
  if (score >= 70) return '#D97706';
  return '#DC2626';
}

function scoreBg(score?: number): string {
  if (score === undefined || score === null) return 'transparent';
  if (score >= 90) return '#DCFCE7';
  if (score >= 70) return '#FEF3C7';
  return '#FEE2E2';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ChecklistExecutions() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ExecutionStatus>('all');
  const [templateFilter, setTemplateFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ─── Filtered data ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return mockChecklistExecutions.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (templateFilter && e.templateName !== templateFilter) return false;
      if (unitFilter && e.unitName !== unitFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.templateName.toLowerCase().includes(q) &&
          !e.unitName.toLowerCase().includes(q) &&
          !e.userName.toLowerCase().includes(q) &&
          !e.id.toLowerCase().includes(q)
        ) return false;
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (new Date(e.startedAt) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (new Date(e.startedAt) > to) return false;
      }
      return true;
    });
  }, [search, statusFilter, templateFilter, unitFilter, dateFrom, dateTo]);

  // ─── Mini-bar stats ───────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    in_progress: mockChecklistExecutions.filter(e => e.status === 'in_progress').length,
    completed:   mockChecklistExecutions.filter(e => e.status === 'completed').length,
    approved:    mockChecklistExecutions.filter(e => e.status === 'approved').length,
    cancelled:   mockChecklistExecutions.filter(e => e.status === 'cancelled').length,
    draft:       mockChecklistExecutions.filter(e => e.status === 'draft').length,
  }), []);

  // ─── Table columns ────────────────────────────────────────────────────────

  const columns: ColumnDef[] = [
    {
      key: 'id',
      label: '#',
      width: '90px',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6366F1', fontWeight: 600 }}>
          {String(val).slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'templateName',
      label: 'Template',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{String(val)}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{String(row.category)}</div>
        </div>
      ),
    },
    {
      key: 'unitName',
      label: 'Unidade',
      sortable: true,
      render: (val) => <span style={{ fontSize: '13px', color: '#0F172A' }}>{String(val)}</span>,
    },
    {
      key: 'userName',
      label: 'Responsável',
      type: 'avatar',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '130px',
      badgeConfig: Object.fromEntries(
        Object.entries(STATUS_CONFIG).map(([k, v]) => [k, { label: v.label, color: v.color, bg: v.bg }])
      ),
    },
    {
      key: 'score',
      label: 'Score',
      width: '80px',
      render: (val) => {
        const score = val as number | undefined;
        if (score === undefined || score === null) {
          return <span style={{ fontSize: '13px', color: '#94A3B8' }}>—</span>;
        }
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: scoreColor(score),
              background: scoreBg(score),
            }}
          >
            {score}%
          </span>
        );
      },
    },
    {
      key: 'startedAt',
      label: 'Iniciado em',
      type: 'date',
      sortable: true,
    },
    {
      key: 'completedAt',
      label: 'Concluído em',
      type: 'date',
    },
  ];

  // ─── Row actions ──────────────────────────────────────────────────────────

  const actions = [
    {
      label: 'Continuar',
      icon: <PlayCircle size={13} />,
      onClick: (row: Record<string, unknown>) => navigate(`/checklists/executions/${row.id}`),
      showCondition: (row: Record<string, unknown>) => row.status === 'in_progress',
    },
    {
      label: 'Visualizar',
      icon: <Eye size={13} />,
      onClick: (row: Record<string, unknown>) => navigate(`/checklists/executions/${row.id}`),
      showCondition: (row: Record<string, unknown>) => row.status === 'completed' || row.status === 'approved',
    },
    {
      label: 'Aprovar',
      icon: <CheckCircle size={13} />,
      onClick: (row: Record<string, unknown>) => { void row; /* TODO: approve */ },
      variant: 'default' as const,
      showCondition: (row: Record<string, unknown>) => row.status === 'completed',
    },
    {
      label: 'Cancelar',
      icon: <XCircle size={13} />,
      onClick: (row: Record<string, unknown>) => { void row; /* TODO: cancel */ },
      variant: 'danger' as const,
      showCondition: (row: Record<string, unknown>) => row.status === 'in_progress' || row.status === 'draft',
    },
  ];

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
            <Link to="/operacao" style={{ color: '#94A3B8', textDecoration: 'none' }}>Operação</Link>
            <span>/</span>
            <Link to="/checklists" style={{ color: '#94A3B8', textDecoration: 'none' }}>Checklists</Link>
            <span>/</span>
            <span style={{ color: '#0F172A', fontWeight: 600 }}>Execuções</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlayCircle size={22} style={{ color: '#6366F1' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Execuções</h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>
            Histórico de todas as execuções de checklist da rede
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/checklists/executions/new')}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <PlayCircle size={15} />
          + Nova Execução
        </button>
      </div>

      {/* Stats mini-bar */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.07)',
          padding: '12px 20px',
          display: 'flex',
          gap: '0',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Em andamento', count: stats.in_progress, color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Concluídas',   count: stats.completed,   color: '#059669', bg: '#D1FAE5' },
          { label: 'Aprovadas',    count: stats.approved,    color: '#7C3AED', bg: '#EDE9FE' },
          { label: 'Rascunho',     count: stats.draft,       color: '#64748B', bg: '#F1F5F9' },
          { label: 'Canceladas',   count: stats.cancelled,   color: '#DC2626', bg: '#FEE2E2' },
        ].map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <div style={{ width: '1px', background: 'rgba(0,0,0,0.07)', margin: '0 20px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '28px',
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  background: item.bg,
                  color: item.color,
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {item.count}
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{item.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.07)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                border: statusFilter === tab.value ? '2px solid #6366F1' : '1px solid rgba(0,0,0,0.1)',
                background: statusFilter === tab.value ? '#EEF2FF' : 'transparent',
                color: statusFilter === tab.value ? '#6366F1' : '#64748B',
                fontSize: '12px',
                fontWeight: statusFilter === tab.value ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span
                  style={{
                    marginLeft: '6px',
                    padding: '0 5px',
                    borderRadius: '999px',
                    background: statusFilter === tab.value ? '#6366F1' : 'rgba(0,0,0,0.08)',
                    color: statusFilter === tab.value ? '#fff' : '#64748B',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {stats[tab.value as ExecutionStatus]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + dropdowns + date */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por template, unidade ou responsável..."
              style={{
                ...inputStyle,
                width: '100%',
                paddingLeft: '32px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Template filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={templateFilter}
              onChange={e => setTemplateFilter(e.target.value)}
              style={{ ...inputStyle, paddingRight: '28px', appearance: 'none' }}
            >
              <option value="">Todos os templates</option>
              {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>

          {/* Unit filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              style={{ ...inputStyle, paddingRight: '28px', appearance: 'none' }}
            >
              <option value="">Todas as unidades</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={inputStyle}
            title="De"
          />
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>até</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={inputStyle}
            title="Até"
          />

          {/* Reset */}
          {(search || statusFilter !== 'all' || templateFilter || unitFilter || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTemplateFilter('');
                setUnitFilter('');
                setDateFrom('');
                setDateTo('');
              }}
              style={{
                padding: '7px 12px',
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#EF4444',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {filtered.length !== mockChecklistExecutions.length && (
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>
            Mostrando <strong style={{ color: '#6366F1' }}>{filtered.length}</strong> de {mockChecklistExecutions.length} execuções
          </div>
        )}
      </div>

      {/* Table */}
      <DynamicTableRenderer
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        keyField="id"
        emptyMessage="Nenhuma execução encontrada com os filtros aplicados."
        emptyIcon={<ClipboardList size={36} />}
        onRowClick={row => navigate(`/checklists/executions/${row.id}`)}
        actions={actions}
      />
    </div>
  );
}
