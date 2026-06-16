import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  LayoutTemplate, Plus, Edit, Play, Copy, ToggleLeft, ToggleRight, Trash2, Search,
} from 'lucide-react';
import { mockChecklistTemplates } from '../../data/checklistMockData';
import * as checklistService from '../../../services/checklistService';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import type { ChecklistTemplate } from '../../../types/checklist';

// ─── Badge configs ─────────────────────────────────────────────────────────────

const categoryBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
  abertura:    { label: 'Abertura',    color: '#10B981', bg: '#ECFDF5' },
  fechamento:  { label: 'Fechamento',  color: '#6366F1', bg: '#EEF2FF' },
  limpeza:     { label: 'Limpeza',     color: '#3B82F6', bg: '#EFF6FF' },
  estoque:     { label: 'Estoque',     color: '#F59E0B', bg: '#FFFBEB' },
  auditoria:   { label: 'Auditoria',   color: '#8B5CF6', bg: '#F5F3FF' },
  manutencao:  { label: 'Manutenção',  color: '#EF4444', bg: '#FEF2F2' },
  operacional: { label: 'Operacional', color: '#64748B', bg: '#F8FAFC' },
};

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
  true:  { label: 'Ativo',   color: '#10B981', bg: '#ECFDF5' },
  false: { label: 'Inativo', color: '#94A3B8', bg: '#F8FAFC' },
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'abertura',    label: 'Abertura' },
  { value: 'fechamento',  label: 'Fechamento' },
  { value: 'limpeza',     label: 'Limpeza' },
  { value: 'estoque',     label: 'Estoque' },
  { value: 'auditoria',   label: 'Auditoria' },
  { value: 'manutencao',  label: 'Manutenção' },
  { value: 'operacional', label: 'Operacional' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ChecklistTemplates() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<ChecklistTemplate[]>(() => [...mockChecklistTemplates]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchSearch =
        !search.trim() ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());

      const matchCategory = !categoryFilter || t.category === categoryFilter;

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && t.active) ||
        (statusFilter === 'inactive' && !t.active);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [templates, search, categoryFilter, statusFilter]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleToggle(id: string) {
    setTemplates(prev =>
      prev.map(t => t.id === id ? { ...t, active: !t.active } : t)
    );
    checklistService.toggleTemplate(id).catch(() => {
      // revert on failure
      setTemplates(prev =>
        prev.map(t => t.id === id ? { ...t, active: !t.active } : t)
      );
    });
  }

  function handleDuplicate(tpl: ChecklistTemplate) {
    const now = new Date().toISOString();
    const copy: ChecklistTemplate = {
      ...tpl,
      id: `tpl-copy-${Date.now()}`,
      name: `${tpl.name} (cópia)`,
      totalExecutions: 0,
      lastExecutedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };
    setTemplates(prev => [copy, ...prev]);
  }

  function handleDelete(id: string) {
    if (!window.confirm('Confirmar exclusão deste template?')) return;
    setTemplates(prev => prev.filter(t => t.id !== id));
    checklistService.deleteTemplate(id).catch(() => {});
  }

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: ColumnDef[] = [
    { key: 'name',             label: 'Nome',             type: 'text',   sortable: true, width: '200px' },
    { key: 'category',         label: 'Categoria',        type: 'badge',  sortable: true, width: '120px', badgeConfig: categoryBadgeConfig },
    {
      key: 'schema',
      label: 'Campos',
      type: 'number',
      width: '80px',
      sortable: false,
      render: (value) => {
        const n = Array.isArray(value) ? value.length : 0;
        return <span style={{ fontSize: '13px', color: '#0F172A', display: 'block', textAlign: 'right' }}>{n}</span>;
      },
    },
    {
      key: 'estimatedMinutes',
      label: 'Estimativa',
      type: 'text',
      width: '100px',
      render: (value) => (
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          {value != null ? `${value} min` : '—'}
        </span>
      ),
    },
    { key: 'totalExecutions', label: 'Execuções',       type: 'number', sortable: true, width: '100px' },
    { key: 'lastExecutedAt',  label: 'Última execução', type: 'date',   sortable: true, width: '130px' },
    {
      key: 'active',
      label: 'Status',
      type: 'badge',
      width: '90px',
      render: (value) => {
        const key = String(value);
        const cfg = statusBadgeConfig[key] ?? statusBadgeConfig.false;
        return (
          <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
            fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color,
            whiteSpace: 'nowrap',
          }}>
            {cfg.label}
          </span>
        );
      },
    },
  ];

  // ── Actions ────────────────────────────────────────────────────────────────

  const tableActions = [
    {
      label: 'Editar',
      icon: <Edit size={14} />,
      onClick: (row: Record<string, unknown>) => navigate(`/checklists/templates/${row.id}`),
    },
    {
      label: 'Executar',
      icon: <Play size={14} />,
      onClick: (row: Record<string, unknown>) => navigate(`/checklists/executions/new?template=${row.id}`),
    },
    {
      label: 'Duplicar',
      icon: <Copy size={14} />,
      onClick: (row: Record<string, unknown>) => handleDuplicate(row as unknown as ChecklistTemplate),
    },
    {
      label: 'Ativar',
      icon: <ToggleLeft size={14} />,
      onClick: (row: Record<string, unknown>) => handleToggle(String(row.id)),
      showCondition: (row: Record<string, unknown>) => !row.active,
    },
    {
      label: 'Desativar',
      icon: <ToggleRight size={14} />,
      onClick: (row: Record<string, unknown>) => handleToggle(String(row.id)),
      showCondition: (row: Record<string, unknown>) => Boolean(row.active),
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={14} />,
      onClick: (row: Record<string, unknown>) => handleDelete(String(row.id)),
      variant: 'danger' as const,
    },
  ];

  // Cast templates to table row format
  const tableData = filtered as unknown as Record<string, unknown>[];

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
          <Link to="/checklists" style={{ color: '#94A3B8', textDecoration: 'none' }}>Operação</Link>
          <span>/</span>
          <Link to="/checklists" style={{ color: '#94A3B8', textDecoration: 'none' }}>Checklists</Link>
          <span>/</span>
          <span style={{ color: '#6366F1', fontWeight: 600 }}>Templates</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutTemplate size={22} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                Templates de Checklist
              </h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                Gerencie os modelos de checklist reutilizáveis da sua rede
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/checklists/templates/new')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px',
              background: '#6366F1', border: 'none',
              fontSize: '13px', fontWeight: 600, color: '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Plus size={14} />
            Novo Template
          </button>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff', borderRadius: '14px', padding: '14px 16px',
          border: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{
              width: '100%', padding: '8px 10px 8px 30px',
              border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px',
              fontSize: '13px', color: '#0F172A', background: '#F8FAFC',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: '13px', color: '#0F172A', background: '#F8FAFC',
            cursor: 'pointer', outline: 'none',
          }}
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          style={{
            padding: '8px 12px', borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: '13px', color: '#0F172A', background: '#F8FAFC',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>

        {/* Results count */}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <DynamicTableRenderer
        columns={columns}
        data={tableData}
        keyField="id"
        emptyMessage="Nenhum template encontrado com os filtros aplicados."
        onRowClick={(row) => navigate(`/checklists/templates/${row.id}`)}
        actions={tableActions}
      />

      {/* ── Pagination info ────────────────────────────────────────────────── */}
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8', textAlign: 'right' }}>
        Mostrando {filtered.length} de {templates.length} template{templates.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
