import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ClipboardCheck, CheckCircle, Clock, TrendingUp, Shield,
  Sun, Moon, Droplets, Package, Search, Wrench, Plus, Settings,
} from 'lucide-react';
import {
  mockChecklistStats,
  mockChecklistExecutions,
  mockChecklistTemplates,
} from '../../data/checklistMockData';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';

// ─── Types / Configs ──────────────────────────────────────────────────────────

type Category = 'abertura' | 'fechamento' | 'limpeza' | 'estoque' | 'auditoria' | 'manutencao' | 'operacional';

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  abertura:    { label: 'Abertura',    color: '#10B981', bg: '#ECFDF5' },
  fechamento:  { label: 'Fechamento',  color: '#6366F1', bg: '#EEF2FF' },
  limpeza:     { label: 'Limpeza',     color: '#3B82F6', bg: '#EFF6FF' },
  estoque:     { label: 'Estoque',     color: '#F59E0B', bg: '#FFFBEB' },
  auditoria:   { label: 'Auditoria',   color: '#8B5CF6', bg: '#F5F3FF' },
  manutencao:  { label: 'Manutenção',  color: '#EF4444', bg: '#FEF2F2' },
  operacional: { label: 'Operacional', color: '#64748B', bg: '#F8FAFC' },
};

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
  in_progress: { label: 'Em andamento', color: '#F59E0B', bg: '#FFFBEB' },
  completed:   { label: 'Concluído',    color: '#10B981', bg: '#ECFDF5' },
  approved:    { label: 'Aprovado',     color: '#6366F1', bg: '#EEF2FF' },
  draft:       { label: 'Rascunho',     color: '#94A3B8', bg: '#F8FAFC' },
  cancelled:   { label: 'Cancelado',    color: '#EF4444', bg: '#FEF2F2' },
};

const categoryCards = [
  { key: 'abertura',   label: 'Abertura',    Icon: Sun,      color: '#10B981', bg: '#ECFDF5' },
  { key: 'fechamento', label: 'Fechamento',  Icon: Moon,     color: '#6366F1', bg: '#EEF2FF' },
  { key: 'limpeza',    label: 'Limpeza',     Icon: Droplets, color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'estoque',    label: 'Estoque',     Icon: Package,  color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'auditoria',  label: 'Auditoria',   Icon: Search,   color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'manutencao', label: 'Manutenção',  Icon: Wrench,   color: '#EF4444', bg: '#FEF2F2' },
];

// ─── Table columns ─────────────────────────────────────────────────────────────

const executionColumns: ColumnDef[] = [
  { key: 'templateName', label: 'Template',  type: 'text',  sortable: true, width: '180px' },
  { key: 'unitName',     label: 'Unidade',   type: 'text',  sortable: true, width: '130px' },
  { key: 'userName',     label: 'Usuário',   type: 'text',  sortable: true, width: '120px' },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    width: '120px',
    badgeConfig: statusBadgeConfig,
  },
  {
    key: 'score',
    label: 'Score',
    type: 'text',
    width: '70px',
    render: (value) => {
      if (value === null || value === undefined) return <span style={{ color: '#CBD5E1' }}>—</span>;
      const n = Number(value);
      const color = n >= 90 ? '#10B981' : n >= 70 ? '#F59E0B' : '#EF4444';
      return (
        <span style={{ fontWeight: 700, color, fontSize: '13px' }}>{n}%</span>
      );
    },
  },
  { key: 'startedAt', label: 'Data', type: 'date', sortable: true, width: '100px' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ChecklistDashboard() {
  const navigate = useNavigate();
  const stats = mockChecklistStats;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Compute per-category execution counts (this week)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const categoryCountsThisWeek = mockChecklistExecutions.reduce<Record<string, number>>((acc, exec) => {
    const d = new Date(exec.startedAt);
    if (d >= weekStart) {
      acc[exec.category] = (acc[exec.category] ?? 0) + 1;
    }
    return acc;
  }, {});

  // Compliance rate card color
  const complianceColor =
    stats.complianceRate >= 90 ? '#10B981' :
    stats.complianceRate >= 70 ? '#F59E0B' :
    '#EF4444';

  const statCards = [
    { label: 'Executados Hoje',       value: String(stats.executedToday),       Icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Pendentes',             value: String(stats.pending),              Icon: Clock,       color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Concluídos esta semana',value: String(stats.completedThisWeek),    Icon: TrendingUp,  color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Taxa de Conformidade',  value: `${stats.complianceRate}%`,         Icon: Shield,      color: complianceColor, bg: complianceColor === '#10B981' ? '#ECFDF5' : complianceColor === '#F59E0B' ? '#FFFBEB' : '#FEF2F2' },
  ];

  // Last 8 executions, filtered by active category
  const filteredExecutions = (activeCategory
    ? mockChecklistExecutions.filter(e => e.category === activeCategory)
    : mockChecklistExecutions
  ).slice(0, 8) as unknown as Record<string, unknown>[];

  // Active templates
  const activeTemplates = mockChecklistTemplates.filter(t => t.active);

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
          <span>Operação</span>
          <span>/</span>
          <span style={{ color: '#6366F1', fontWeight: 600 }}>Checklists</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardCheck size={22} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                Checklists Operacionais
              </h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                Acompanhe conformidade operacional da rede em tempo real
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/checklists/templates"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px',
                border: '1px solid rgba(99,102,241,0.3)',
                fontSize: '13px', fontWeight: 600, color: '#6366F1',
                background: 'transparent', textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <Settings size={14} />
              Gerenciar Templates
            </Link>
            <button
              onClick={() => navigate('/checklists/executions/new')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px',
                background: '#6366F1', border: 'none',
                fontSize: '13px', fontWeight: 600, color: '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Plus size={14} />
              Nova Execução
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {statCards.map(card => {
          const Icon = card.Icon;
          return (
            <div
              key={card.label}
              style={{
                background: '#fff', borderRadius: '16px', padding: '18px 20px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Category Quick-Access ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          Filtrar por Categoria
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
          {categoryCards.map(cat => {
            const Icon = cat.Icon;
            const isActive = activeCategory === cat.key;
            const count = categoryCountsThisWeek[cat.key] ?? 0;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(isActive ? null : cat.key)}
                style={{
                  background: isActive ? cat.bg : '#fff',
                  border: isActive ? `2px solid ${cat.color}` : '2px solid rgba(0,0,0,0.06)',
                  borderRadius: '14px',
                  padding: '14px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? `0 0 0 3px ${cat.color}22` : 'none',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: cat.color }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>{cat.label}</span>
                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>
                  {count} esta semana
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Left: Últimas Execuções */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Últimas Execuções
              {activeCategory && (
                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, color: categoryConfig[activeCategory]?.color, background: categoryConfig[activeCategory]?.bg, padding: '2px 8px', borderRadius: '999px' }}>
                  {categoryConfig[activeCategory]?.label}
                </span>
              )}
            </h2>
            <Link
              to="/checklists/executions"
              style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}
            >
              Ver todas →
            </Link>
          </div>

          <DynamicTableRenderer
            columns={executionColumns}
            data={filteredExecutions}
            keyField="id"
            emptyMessage="Nenhuma execução encontrada para esta categoria."
            onRowClick={(row) => navigate(`/checklists/executions/${row.id}`)}
          />
        </div>

        {/* Right: Templates Ativos */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Templates Ativos
            </h2>
            <Link
              to="/checklists/templates"
              style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}
            >
              Ver todos →
            </Link>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {activeTemplates.map((tpl, idx) => {
              const cat = categoryConfig[tpl.category] ?? categoryConfig.operacional;
              return (
                <div
                  key={tpl.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: idx < activeTemplates.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {tpl.name}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '1px 7px',
                        borderRadius: '999px', color: cat.color, background: cat.bg,
                        whiteSpace: 'nowrap',
                      }}>
                        {cat.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      {tpl.schema.length} campos
                    </div>
                  </div>
                  <Link
                    to={`/checklists/executions/new?template=${tpl.id}`}
                    style={{
                      flexShrink: 0,
                      fontSize: '12px', fontWeight: 600,
                      color: '#6366F1', textDecoration: 'none',
                      background: '#EEF2FF', borderRadius: '8px',
                      padding: '5px 10px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >
                    Executar →
                  </Link>
                </div>
              );
            })}

            {activeTemplates.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Nenhum template ativo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
