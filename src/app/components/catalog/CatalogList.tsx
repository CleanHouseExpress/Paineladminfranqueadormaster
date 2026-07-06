import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Package, CheckCircle, MinusCircle, Archive, TrendingUp,
  Boxes, Briefcase, RefreshCw, GraduationCap, Stethoscope,
  Star, Search, Settings, Plus, Eye, Edit, Trash2, X,
} from 'lucide-react';
import { CATALOG_TYPE_CONFIG, CATALOG_STATUS_CONFIG, DEFAULT_CATALOG_LABELS } from '../../../types/catalog';
import type { CatalogItem, CatalogItemType, CatalogItemStatus, CatalogStats } from '../../../types/catalog';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import {
  archiveItem, deleteItem, getCatalogConfig, getItems, getStats, reactivateItem,
} from '../../../services/catalogService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

const TYPE_ICONS: Record<CatalogItemType, React.ReactNode> = {
  product:      <Package size={12} />,
  service:      <Briefcase size={12} />,
  subscription: <RefreshCw size={12} />,
  course:       <GraduationCap size={12} />,
  procedure:    <Stethoscope size={12} />,
  plan:         <Star size={12} />,
  custom:       <Boxes size={12} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CatalogList() {
  const navigate = useNavigate();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [stats, setStats] = useState<CatalogStats>({
    total: 0, active: 0, inactive: 0, archived: 0, avgPrice: 0, byType: [], recentItems: [],
  });
  const [labels, setLabels] = useState(DEFAULT_CATALOG_LABELS);
  const [enabledTypes, setEnabledTypes] = useState<CatalogItemType[]>(Object.keys(CATALOG_TYPE_CONFIG) as CatalogItemType[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextItems, nextStats, config] = await Promise.all([getItems(), getStats(), getCatalogConfig()]);
      setItems(nextItems);
      setStats(nextStats);
      setLabels(config.labels);
      setEnabledTypes(config.enabledTypes);
    } catch {
      setError('Nao foi possivel carregar o catalogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [priceMin,     setPriceMin]     = useState('');
  const [priceMax,     setPriceMax]     = useState('');
  const [skuFilter,    setSkuFilter]    = useState('');

  const filtersActive = !!(search || typeFilter || statusFilter || scopeFilter || approvalFilter || priceMin || priceMax || skuFilter);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku ?? '').toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q);
      const matchType   = !typeFilter   || item.type === typeFilter;
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchScope = !scopeFilter || item.scope === scopeFilter;
      const matchApproval = !approvalFilter || item.approvalStatus === approvalFilter;
      const matchSku    = !skuFilter    || (item.sku ?? '').toLowerCase().includes(skuFilter.toLowerCase());
      const matchMin    = !priceMin     || item.price >= parseFloat(priceMin);
      const matchMax    = !priceMax     || item.price <= parseFloat(priceMax);
      return matchSearch && matchType && matchStatus && matchScope && matchApproval && matchSku && matchMin && matchMax;
    });
  }, [items, search, typeFilter, statusFilter, scopeFilter, approvalFilter, skuFilter, priceMin, priceMax]);

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      key: 'name',
      label: 'Nome',
      type: 'text',
      sortable: true,
      width: '260px',
      render: (_val, row) => {
        const type   = row.type as CatalogItemType;
        const cfg    = CATALOG_TYPE_CONFIG[type];
        const price  = row.price as number;
        const status = row.status as CatalogItemStatus;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: cfg.bg,
                color: cfg.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {TYPE_ICONS[type]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {String(row.name)}
              </div>
              {row.sku && (
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                  {String(row.sku)}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: status === 'active' ? '#10B981' : '#94A3B8',
                whiteSpace: 'nowrap',
                fontFamily: 'monospace',
              }}
            >
              {formatCurrency(price)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Tipo',
      type: 'badge',
      width: '130px',
      badgeConfig: Object.fromEntries(
        Object.entries(CATALOG_TYPE_CONFIG).map(([k, v]) => [k, { label: v.label, color: v.color, bg: v.bg }])
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '100px',
      badgeConfig: Object.fromEntries(
        Object.entries(CATALOG_STATUS_CONFIG).map(([k, v]) => [k, { label: v.label, color: v.color, bg: v.bg }])
      ),
    },
    {
      key: 'scope',
      label: 'Origem',
      type: 'badge',
      width: '120px',
      badgeConfig: {
        corporate: { label: 'Corporativo', color: '#4338CA', bg: '#EEF2FF' },
        local: { label: 'Local', color: '#047857', bg: '#ECFDF5' },
      },
    },
    {
      key: 'approvalStatus',
      label: 'Aprovacao',
      type: 'badge',
      width: '120px',
      badgeConfig: {
        draft: { label: 'Rascunho', color: '#64748B', bg: '#F1F5F9' },
        pending: { label: 'Pendente', color: '#B45309', bg: '#FFFBEB' },
        approved: { label: 'Aprovado', color: '#047857', bg: '#ECFDF5' },
        rejected: { label: 'Rejeitado', color: '#B91C1C', bg: '#FEF2F2' },
      },
    },
    {
      key: 'price',
      label: 'Preço',
      type: 'text',
      sortable: true,
      width: '110px',
      render: (_val, row) => {
        const status = row.status as CatalogItemStatus;
        return (
          <span
            style={{
              display: 'block',
              textAlign: 'right',
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 600,
              color: status === 'active' ? '#10B981' : '#94A3B8',
            }}
          >
            {formatCurrency(row.price as number)}
          </span>
        );
      },
    },
    {
      key: 'unit',
      label: 'Unidade',
      type: 'text',
      width: '80px',
      render: (_val, row) => (
        <span style={{ fontSize: 12, color: '#64748B' }}>{String(row.unit || '—')}</span>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      width: '110px',
      render: (_val, row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94A3B8' }}>
          {String(row.sku || '—')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Criado em',
      type: 'date',
      width: '100px',
    },
    {
      key: '__actions__',
      label: 'Ações',
      type: 'actions',
      width: '60px',
    },
  ];

  // ── Row actions ────────────────────────────────────────────────────────────
  const actions = [
    {
      label: 'Visualizar',
      icon: <Eye size={14} />,
      onClick: (row: Record<string, unknown>) => navigate(`/catalog/${row.id}`),
    },
    {
      label: 'Editar',
      icon: <Edit size={14} />,
      showCondition: (row: Record<string, unknown>) => row.status !== 'archived',
      onClick: (row: Record<string, unknown>) => navigate(`/catalog/${row.id}/edit`),
    },
    {
      label: 'Arquivar',
      icon: <Archive size={14} />,
      showCondition: (row: Record<string, unknown>) => row.status === 'active',
      onClick: async (row: Record<string, unknown>) => {
        await archiveItem(String(row.id));
        await load();
      },
    },
    {
      label: 'Reativar',
      icon: <RefreshCw size={14} />,
      showCondition: (row: Record<string, unknown>) => row.status === 'archived' || row.status === 'inactive',
      onClick: async (row: Record<string, unknown>) => {
        await reactivateItem(String(row.id));
        await load();
      },
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={14} />,
      variant: 'danger' as const,
      showCondition: (row: Record<string, unknown>) => row.status !== 'active',
      onClick: async (row: Record<string, unknown>) => {
        if (!window.confirm(`Excluir ${String(row.name)}?`)) return;
        await deleteItem(String(row.id));
        await load();
      },
    },
  ];

  // ── Table data ─────────────────────────────────────────────────────────────
  const tableData = useMemo(
    () =>
      filtered.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        status: item.status,
        scope: item.scope ?? 'corporate',
        approvalStatus: item.approvalStatus ?? 'approved',
        price: item.price,
        unit: item.unit,
        sku: item.sku,
        createdAt: formatDate(item.createdAt),
      })),
    [filtered],
  );

  // ── Type distribution total ────────────────────────────────────────────────
  const distTotal = stats.byType.reduce((s, t) => s + t.count, 0) || 1;

  if (loading) {
    return <div style={{ padding: 40 }}><ModuleStateView state="loading" /></div>;
  }

  if (error) {
    return <div style={{ padding: 40 }}><ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '24px' }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: 13, color: '#64748B' }}>
        <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Início</Link>
        <span>›</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{labels.moduleTitle}</span>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {labels.plural}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
              Gestão de produtos, serviços, cursos, planos e itens da operação.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/catalog/settings')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 600,
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <Settings size={14} />
            Configurações
          </button>
          <button
            onClick={() => navigate('/catalog/new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            }}
          >
            <Plus size={14} />
            {labels.newItem}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total',       value: stats.total,                        icon: <Boxes size={18} />,      color: '#6366F1', bg: '#EEF2FF' },
          { label: 'Ativos',      value: stats.active,                       icon: <CheckCircle size={18} />, color: '#10B981', bg: '#ECFDF5' },
          { label: 'Inativos',    value: stats.inactive,                     icon: <MinusCircle size={18} />, color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Arquivados',  value: stats.archived,                     icon: <Archive size={18} />,    color: '#64748B', bg: '#F1F5F9' },
          { label: 'Preço Médio', value: `R$ ${stats.avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <TrendingUp size={18} />, color: '#3B82F6', bg: '#EFF6FF' },
        ].map(kpi => (
          <div
            key={kpi.label}
            style={{
              background: '#fff',
              borderRadius: '14px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {kpi.label}
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: kpi.bg,
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {kpi.icon}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Type Distribution Widget ──────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
          Distribuição por Tipo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {stats.byType.filter(t => t.count > 0).map(t => {
            const pct = (t.count / distTotal) * 100;
            return (
              <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: t.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: '#475569', flex: '0 0 auto', minWidth: 80 }}>{t.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: '#CBD5E1',
                    borderRadius: '99px',
                    padding: '1px 7px',
                    flex: '0 0 auto',
                  }}
                >
                  {t.count}
                </span>
                <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: t.color,
                      opacity: 0.7,
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '14px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Buscar ${labels.plural.toLowerCase()}...`}
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 10,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: 13,
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tipo */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Todos os Tipos</option>
          {Object.entries(CATALOG_TYPE_CONFIG).filter(([key]) => enabledTypes.includes(key as CatalogItemType)).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Todos os Status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="archived">Arquivado</option>
        </select>

        <select
          value={scopeFilter}
          onChange={e => setScopeFilter(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Todas as Origens</option>
          <option value="corporate">Corporativo</option>
          <option value="local">Local</option>
        </select>

        <select
          value={approvalFilter}
          onChange={e => setApprovalFilter(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Todas as Aprovações</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
          <option value="draft">Rascunho</option>
        </select>

        {/* Price range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>De R$</span>
          <input
            type="number"
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            placeholder="0"
            style={{ width: 70, padding: '8px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', outline: 'none' }}
          />
          <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>Até R$</span>
          <input
            type="number"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            placeholder="∞"
            style={{ width: 70, padding: '8px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', outline: 'none' }}
          />
        </div>

        {/* SKU */}
        <input
          value={skuFilter}
          onChange={e => setSkuFilter(e.target.value)}
          placeholder="SKU..."
          style={{ width: 100, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', outline: 'none', fontFamily: 'monospace' }}
        />

        {filtersActive && (
          <button
            onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setScopeFilter(''); setApprovalFilter(''); setPriceMin(''); setPriceMax(''); setSkuFilter(''); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              background: '#fff',
              fontSize: 12,
              fontWeight: 600,
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
            Limpar filtros
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>
          {filtered.length} {filtered.length === 1 ? labels.singular : labels.plural}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <DynamicTableRenderer
        columns={columns}
        data={tableData}
        keyField="id"
        onRowClick={row => navigate(`/catalog/${row.id}`)}
        actions={actions}
        emptyMessage={`Nenhum ${labels.singular.toLowerCase()} encontrado.`}
        emptyIcon={<Package size={32} style={{ color: '#CBD5E1' }} />}
      />
    </div>
  );
}
