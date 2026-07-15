import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  AlertTriangle, ArrowLeftRight, Boxes, Building2, CheckCircle, ChevronLeft,
  ChevronRight, DollarSign, Edit, Eye, MapPin, Package, Plus, RotateCcw, Save, Settings, Trash2,
  Truck, X, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { DynamicFormRenderer } from '../../../shared/components/DynamicFormRenderer';
import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import { unitManagementService } from '../../../services/unitManagementService';
import { inventoryService } from '../../../services/inventoryService';
import { getApiErrorMessage } from '../../../services/apiClient';
import {
  INVENTORY_PERMISSIONS, MOVEMENT_TYPE_CONFIG, UNITS_OF_MEASURE,
  type InventoryCategory, type InventoryItem, type InventoryMetadata,
  type InventoryMetrics, type InventoryMovement, type InventoryPayload,
  type InventorySettings, type InventorySupplier, type MovementType,
  type StockBalance, type StockLocation,
} from '../../../types/inventory';
import type { UnitOption } from '../../../types/unitManagement';
import type { DynamicFieldSchema } from '../../../types/userManagement';

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid rgba(0,0,0,.12)',
  borderRadius: 9, fontSize: 13, color: '#0F172A', background: '#fff',
  outline: 'none', boxSizing: 'border-box',
};
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14,
  boxShadow: '0 1px 4px rgba(15,23,42,.04)',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function dateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

const DEFAULT_TERMS = {
  module: 'Estoque',
  modulePlural: 'Estoque',
  item: 'Item',
  itemPlural: 'Itens',
  location: 'Local',
  locationPlural: 'Locais',
  balance: 'Saldo',
  balancePlural: 'Saldos',
  movement: 'Movimento',
  movementPlural: 'Movimentacoes',
  entry: 'Entrada',
  exit: 'Saida',
  adjustment: 'Ajuste',
};

type InventoryTerms = typeof DEFAULT_TERMS;

function term(settings: InventorySettings | null, key: keyof InventoryTerms) {
  const terminology = (settings?.terminology_json ?? settings?.terminology ?? {}) as Record<string, unknown>;
  const dotted: Record<keyof InventoryTerms, string> = {
    module: 'inventory.module.singular',
    modulePlural: 'inventory.module.plural',
    item: 'inventory.item.singular',
    itemPlural: 'inventory.item.plural',
    location: 'inventory.location.singular',
    locationPlural: 'inventory.location.plural',
    balance: 'inventory.balance.singular',
    balancePlural: 'inventory.balance.plural',
    movement: 'inventory.movement.singular',
    movementPlural: 'inventory.movement.plural',
    entry: 'inventory.entry.singular',
    exit: 'inventory.exit.singular',
    adjustment: 'inventory.adjustment.singular',
  };
  const configured = terminology[key] ?? terminology[dotted[key]];
  return typeof configured === 'string' && configured.trim() ? configured : DEFAULT_TERMS[key];
}

function useInventorySettings() {
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      setSettings(await inventoryService.getSettings());
    } catch {
      setError('Nao foi possivel carregar as configuracoes de estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  return { settings, loading, error, reload };
}

function InventoryCapabilityState({ settings, loading, error, children }: {
  settings: InventorySettings | null;
  loading: boolean;
  error: string;
  children: React.ReactNode;
}) {
  if (loading) return <ModuleStateView state="loading" />;
  if (error) return <ModuleStateView state="error" errorMessage={error} />;
  if (!settings?.inventory_enabled) {
    return (
      <div style={pageStyle}>
        <PageHeader title={term(settings, 'module')} description="Capability desabilitada para este tenant." icon={<Boxes size={22} />} />
        <div style={{ ...cardStyle, padding: 24 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Estoque desabilitado</h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>
            O modulo esta oculto para operacao enquanto a capability nao for ativada nas configuracoes do tenant.
          </p>
          <Link to="/inventory/settings" style={{ display: 'inline-flex', marginTop: 14, color: '#4F46E5', fontSize: 13, fontWeight: 700 }}>Abrir configuracoes</Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function stockState(item: InventoryItem) {
  if (!item.trackInventory) return { label: 'Não controlado', color: '#64748B', bg: '#F1F5F9' };
  if (item.currentStock <= 0) return { label: 'Sem estoque', color: '#EF4444', bg: '#FEF2F2' };
  if (item.currentStock <= item.minimumStock) return { label: 'Estoque baixo', color: '#D97706', bg: '#FFFBEB' };
  return { label: 'Normal', color: '#10B981', bg: '#ECFDF5' };
}

function PageHeader({
  title, description, icon = <Boxes size={22} />, back, actions,
}: {
  title: string; description?: string; icon?: React.ReactNode; back?: string; actions?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      {back && (
        <Link to={back} style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: '#64748B', textDecoration: 'none', fontSize: 12, marginBottom: 10 }}>
          <ChevronLeft size={13} /> Voltar
        </Link>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
            {icon}
          </div>
          <div>
            <h1 style={{ margin: 0, color: '#0F172A', fontSize: 22, fontWeight: 800 }}>{title}</h1>
            {description && <p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>{description}</p>}
          </div>
        </div>
        {actions && <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px',
      borderRadius: 10, border: 0, background: disabled ? '#CBD5E1' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
      color: '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{children}</button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 650, cursor: 'pointer' }}>{children}</button>;
}

function useInventoryData() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextItems, nextCategories, nextSuppliers] = await Promise.all([
        inventoryService.listItems(), inventoryService.listCategories(), inventoryService.listSuppliers(),
      ]);
      setItems(nextItems);
      setCategories(nextCategories);
      setSuppliers(nextSuppliers);
    } catch {
      setError('Não foi possível carregar os dados de estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);
  return { items, categories, suppliers, loading, error, reload };
}

export function InventoryDashboard() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const settingsState = useInventorySettings();
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!settingsState.settings?.inventory_enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([
      inventoryService.getMetrics(),
      inventoryService.listItems(),
      inventoryService.listBalances(),
      inventoryService.listLocations(),
      inventoryService.listMovements(),
    ]).then(([nextMetrics, nextItems, nextBalances, nextLocations, nextMovements]) => {
      setMetrics(nextMetrics);
      setItems(nextItems);
      setBalances(nextBalances);
      setLocations(nextLocations);
      setMovements(nextMovements);
    }).catch(() => setError('Nao foi possivel carregar o painel de estoque.'))
      .finally(() => setLoading(false));
  }, [settingsState.settings?.inventory_enabled]);

  if (settingsState.loading || loading) return <ModuleStateView state="loading" />;
  if (settingsState.error || error || !metrics) {
    return <InventoryCapabilityState {...settingsState}><ModuleStateView state="error" errorMessage={settingsState.error || error} /></InventoryCapabilityState>;
  }

  const totalOnHand = balances.reduce((total, balance) => total + balance.onHand, 0);
  const totalAvailable = balances.reduce((total, balance) => total + balance.available, 0);
  const inventoryValue = balances.reduce((total, balance) => total + balance.onHand * balance.averageCost, 0);
  const critical = items.filter(item => item.trackInventory && item.currentStock <= item.minimumStock).slice(0, 6);
  const showCosts = hasPermission(INVENTORY_PERMISSIONS.costView);
  const kpis = [
    [`Total de ${term(settingsState.settings, 'itemPlural')}`, metrics.items, Boxes, '#6366F1', '#EEF2FF'],
    ['Ativos', metrics.activeItems, CheckCircle, '#10B981', '#ECFDF5'],
    ['Estoque baixo', metrics.lowStock, AlertTriangle, '#F59E0B', '#FFFBEB'],
    ['Sem estoque', metrics.outOfStock, XCircle, '#EF4444', '#FEF2F2'],
    [term(settingsState.settings, 'locationPlural'), locations.length, MapPin, '#3B82F6', '#EFF6FF'],
    ['On hand', totalOnHand, Boxes, '#0F766E', '#ECFDF5'],
    ['Disponivel', totalAvailable, CheckCircle, '#10B981', '#ECFDF5'],
    ['Movim. hoje', metrics.movementsToday, ArrowLeftRight, '#8B5CF6', '#F5F3FF'],
    ...(showCosts ? [['Valor em estoque', money(inventoryValue || metrics.inventoryValue), DollarSign, '#10B981', '#ECFDF5'] as const] : []),
  ] as const;

  const valueByUnit = new Map<string, number>();
  balances.forEach(balance => {
    const name = balance.unitName ?? `Unidade ${balance.unitId ?? 'geral'}`;
    valueByUnit.set(name, (valueByUnit.get(name) ?? 0) + balance.onHand * balance.averageCost);
  });

  return (
    <InventoryCapabilityState {...settingsState}>
      <div style={pageStyle}>
        <PageHeader
          title={`${term(settingsState.settings, 'module')} & Suprimentos`}
          description={`Controle de ${term(settingsState.settings, 'itemPlural').toLowerCase()}, ${term(settingsState.settings, 'locationPlural').toLowerCase()}, ${term(settingsState.settings, 'movementPlural').toLowerCase()} e saldo por unidade.`}
          actions={<>
            <SecondaryButton onClick={() => navigate('/inventory/balances')}><Boxes size={14} /> {term(settingsState.settings, 'balancePlural')}</SecondaryButton>
            {hasPermission(INVENTORY_PERMISSIONS.entryCreate) && <SecondaryButton onClick={() => navigate('/inventory/movements?new=1')}><ArrowLeftRight size={14} /> Novo {term(settingsState.settings, 'movement')}</SecondaryButton>}
            {hasPermission(INVENTORY_PERMISSIONS.itemsManage) && <PrimaryButton onClick={() => navigate('/inventory/items/new')}><Plus size={14} /> Novo {term(settingsState.settings, 'item')}</PrimaryButton>}
          </>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 12, marginBottom: 18 }}>
          {kpis.map(([label, value, Icon, color, bg]) => (
            <div key={label} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: '#64748B', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {label}<span style={{ width: 30, height: 30, borderRadius: 8, background: bg, color, display: 'grid', placeItems: 'center' }}><Icon size={15} /></span>
              </div>
              <div style={{ marginTop: 7, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{value}</div>
            </div>
          ))}
        </div>
        {critical.length > 0 && (
          <div style={{ ...cardStyle, borderColor: '#FCD34D', background: '#FFFBEB', padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 9 }}>
            <AlertTriangle size={17} color="#D97706" />
            <span style={{ flex: 1, color: '#92400E', fontSize: 13, fontWeight: 650 }}>{critical.length} {term(settingsState.settings, 'itemPlural').toLowerCase()} precisam de atencao.</span>
            <Link to="/inventory/items?critical=1" style={{ color: '#D97706', fontSize: 12, fontWeight: 700 }}>Ver criticos</Link>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(280px,1fr)', gap: 16 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <h2 style={{ margin: '0 0 13px', fontSize: 14 }}>Estoque critico</h2>
              {critical.length === 0 ? <p style={{ color: '#10B981', fontSize: 13 }}>Todos os itens estao em niveis adequados.</p> : critical.map(item => {
                const state = stockState(item);
                return <Link key={item.id} to={`/inventory/items/${item.id}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '10px 6px', borderTop: '1px solid #F1F5F9', textDecoration: 'none', alignItems: 'center' }}>
                  <div><strong style={{ color: '#0F172A', fontSize: 13 }}>{item.name}</strong><div style={{ color: '#94A3B8', fontSize: 11 }}>{item.categoryName ?? 'Sem categoria'}</div></div>
                  <strong style={{ color: state.color, fontSize: 13 }}>{item.currentStock} {item.unitOfMeasure}</strong>
                  <span style={{ color: state.color, background: state.bg, borderRadius: 99, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>{state.label}</span>
                </Link>;
              })}
            </div>
            <div style={{ ...cardStyle, padding: 18 }}>
              <h2 style={{ margin: '0 0 13px', fontSize: 14 }}>Ultimas movimentacoes</h2>
              {movements.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 12 }}>Nenhum movimento confirmado.</p> : movements.slice(0, 6).map(movement => {
                const cfg = MOVEMENT_TYPE_CONFIG[movement.type];
                return <button key={movement.id} type="button" onClick={() => navigate('/inventory/movements')} style={{ width: '100%', border: 0, background: 'transparent', display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 10, padding: '9px 6px', borderTop: '1px solid #F1F5F9', alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ color: cfg.color, background: cfg.bg, borderRadius: 99, padding: '3px 8px', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{cfg.label}</span>
                  <div><strong style={{ fontSize: 12 }}>{movement.items?.map(item => item.itemName).join(', ') || movement.itemName}</strong><div style={{ color: '#94A3B8', fontSize: 10 }}>{movement.unitName ?? 'Estoque geral'} - {dateTime(movement.createdAt)}</div></div>
                  <strong style={{ color: cfg.color, fontSize: 12 }}>{cfg.sign}{Math.abs(movement.quantity)} {movement.itemUnit}</strong>
                </button>;
              })}
            </div>
          </div>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 13px', fontSize: 14, display: 'flex', gap: 7, alignItems: 'center' }}><Building2 size={15} color="#3B82F6" /> Valor por unidade</h2>
            {!showCosts ? <p style={{ color: '#94A3B8', fontSize: 12 }}>Custos ocultos pela permissao do usuario.</p> : valueByUnit.size === 0 ? <p style={{ color: '#94A3B8', fontSize: 12 }}>Sem saldos por unidade.</p> : [...valueByUnit].map(([name, value]) => (
              <div key={name} style={{ padding: '12px 0', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>{name}</span><strong>{money(value)}</strong></div>
                <div style={{ height: 5, background: '#E2E8F0', borderRadius: 99, marginTop: 7 }}><div style={{ width: `${Math.min(100, (value / Math.max(inventoryValue || metrics.inventoryValue, 1)) * 100)}%`, height: '100%', background: '#3B82F6', borderRadius: 99 }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </InventoryCapabilityState>
  );
}
export function InventoryItems() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = usePermission();
  const { items, categories, suppliers, loading, error, reload } = useInventoryData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [status, setStatus] = useState('');
  const [unit, setUnit] = useState('');
  const [critical, setCritical] = useState(searchParams.get('critical') === '1');
  const unitOptions = useMemo(() => {
    const options = new Map<string, string>();
    items.forEach(item => item.unitBalances.forEach(balance => options.set(balance.unitId, balance.unitName ?? `Unidade ${balance.unitId}`)));
    return [...options];
  }, [items]);

  const filtered = items.filter(item => {
    if (search && !`${item.name} ${item.sku ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && item.categoryId !== category) return false;
    if (supplier && item.supplierId !== supplier) return false;
    if (status && String(item.active) !== status) return false;
    if (unit && !item.unitBalances.some(balance => balance.unitId === unit)) return false;
    if (critical && (!item.trackInventory || item.currentStock > item.minimumStock)) return false;
    return true;
  });

  const columns: ColumnDef[] = [
    { key: 'name', label: 'Insumo', sortable: true, width: '190px', render: (_, row) => <div><strong style={{ fontSize: 13 }}>{String(row.name)}</strong><div style={{ fontFamily: 'monospace', color: '#94A3B8', fontSize: 10 }}>{String(row.sku ?? 'Sem SKU')}</div></div> },
    { key: 'categoryName', label: 'Categoria', width: '120px' },
    { key: 'supplierName', label: 'Fornecedor', width: '150px' },
    { key: 'unitOfMeasure', label: 'Un.', width: '55px' },
    { key: 'currentStock', label: 'Estoque', sortable: true, width: '100px', render: (_, row) => {
      const item = row as unknown as InventoryItem; const state = stockState(item);
      return <strong style={{ color: state.color }}>{item.currentStock} {item.unitOfMeasure}</strong>;
    } },
    { key: 'minimumStock', label: 'Mínimo', type: 'number', width: '80px' },
    { key: 'averageCost', label: 'Custo médio', width: '110px', render: value => money(Number(value)) },
    { key: 'active', label: 'Status', width: '90px', render: value => <span style={{ color: value ? '#10B981' : '#64748B', background: value ? '#ECFDF5' : '#F1F5F9', borderRadius: 99, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>{value ? 'Ativo' : 'Inativo'}</span> },
  ];

  const remove = async (id: string) => {
    if (!window.confirm('Excluir este insumo? O histórico de movimentações também será removido.')) return;
    try { await inventoryService.deleteItem(id); toast.success('Insumo excluído.'); await reload(); }
    catch { toast.error('Não foi possível excluir o insumo.'); }
  };

  if (error) return <ModuleStateView state="error" errorMessage={error} />;
  return (
    <div style={pageStyle}>
      <PageHeader title="Insumos" description="Materiais, matérias-primas, embalagens e itens de consumo interno." back="/inventory" actions={
        hasPermission(INVENTORY_PERMISSIONS.create) ? <PrimaryButton onClick={() => navigate('/inventory/items/new')}><Plus size={14} /> Novo Insumo</PrimaryButton> : undefined
      } />
      <div style={{ ...cardStyle, padding: 13, marginBottom: 14, display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) repeat(4,minmax(115px,.55fr)) auto', gap: 9 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar nome ou SKU..." style={inputStyle} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}><option value="">Todas as categorias</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={supplier} onChange={e => setSupplier(e.target.value)} style={inputStyle}><option value="">Todos os fornecedores</option>{suppliers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}><option value="">Todos os status</option><option value="true">Ativos</option><option value="false">Inativos</option></select>
        <select value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle}><option value="">Todas as unidades</option>{unitOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <button onClick={() => setCritical(value => !value)} style={{ border: `1px solid ${critical ? '#F59E0B' : '#CBD5E1'}`, background: critical ? '#FFFBEB' : '#fff', color: critical ? '#D97706' : '#64748B', borderRadius: 9, padding: '0 12px', fontWeight: 700, cursor: 'pointer' }}>Estoque crítico</button>
      </div>
      <DynamicTableRenderer
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="Nenhum insumo encontrado."
        onRowClick={row => navigate(`/inventory/items/${row.id}`)}
        actions={[
          { label: 'Visualizar', onClick: row => navigate(`/inventory/items/${row.id}`) },
          { label: 'Editar', icon: <Edit size={13} />, onClick: row => navigate(`/inventory/items/${row.id}/edit`), showCondition: () => hasPermission(INVENTORY_PERMISSIONS.update) },
          { label: 'Excluir', icon: <Trash2 size={13} />, variant: 'danger', onClick: row => void remove(String(row.id)), showCondition: () => hasPermission(INVENTORY_PERMISSIONS.delete) },
        ]}
      />
    </div>
  );
}

function normalizedMetadata(metadata: InventoryMetadata): InventoryMetadata {
  return {
    ...metadata,
    fields: metadata.fields ?? metadata.form_schema ?? [],
    table_columns: metadata.table_columns ?? metadata.table_schema ?? [],
  };
}

export function InventoryItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [metadata, setMetadata] = useState<InventoryMetadata | null>(null);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({ active: true, track_inventory: true, minimum_stock: 0, unit_of_measure: 'un', metadata: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([
      inventoryService.getMetadata('inventory_items'),
      inventoryService.listCategories(),
      inventoryService.listSuppliers(),
      editing && id ? inventoryService.getItem(id) : Promise.resolve(null),
    ]).then(([schema, nextCategories, nextSuppliers, item]) => {
      setMetadata(normalizedMetadata(schema));
      setCategories(nextCategories); setSuppliers(nextSuppliers);
      if (item) setValues({
        name: item.name, description: item.description ?? '', sku: item.sku ?? '',
        barcode: item.barcode ?? '', unit_of_measure: item.unitOfMeasure,
        category_id: item.categoryId ?? '', supplier_id: item.supplierId ?? '',
        active: item.active, track_inventory: item.trackInventory,
        minimum_stock: item.minimumStock, current_stock: item.currentStock,
        average_cost: item.averageCost, metadata: item.metadata,
        ...item.metadata,
      });
    }).catch(() => setError('Não foi possível carregar o formulário.')).finally(() => setLoading(false));
  }, [editing, id]);

  const schema = useMemo(() => {
    if (!metadata) return [];
    const categoryOptions = categories.map(item => ({ value: item.id, label: item.name }));
    const supplierOptions = suppliers.map(item => ({ value: item.id, label: item.name }));
    return metadata.fields.map(field => {
      if (field.key === 'category_id') return { ...field, options: categoryOptions, options_source: undefined };
      if (field.key === 'supplier_id') return { ...field, options: supplierOptions, options_source: undefined };
      if (field.key === 'unit_of_measure') return { ...field, type: 'select', field_type: 'select', options: [...UNITS_OF_MEASURE] };
      return field;
    }).filter(field => field.visible !== false && !['current_stock', 'average_cost', 'metadata'].includes(String(field.key)));
  }, [categories, editing, metadata, suppliers]);

  const save = async () => {
    if (!values.name || !values.unit_of_measure) { toast.error('Preencha nome e unidade de medida.'); return; }
    const customKeys = new Set(schema.filter(field => ![
      'name', 'description', 'sku', 'barcode', 'unit_of_measure', 'category_id', 'supplier_id',
      'active', 'track_inventory', 'minimum_stock', 'current_stock', 'average_cost', 'metadata',
    ].includes(String(field.key))).map(field => String(field.key)));
    const payload: InventoryPayload = {
      ...values,
      metadata: Object.fromEntries([...customKeys].map(key => [key, values[key]]).filter(([, value]) => value !== undefined)),
    };
    setSaving(true);
    try {
      const item = editing && id ? await inventoryService.updateItem(id, payload) : await inventoryService.createItem(payload);
      toast.success(editing ? 'Insumo atualizado.' : 'Insumo criado.');
      navigate(`/inventory/items/${item.id}`);
    } catch { toast.error('Não foi possível salvar o insumo.'); }
    finally { setSaving(false); }
  };

  if (loading) return <ModuleStateView state="loading" />;
  if (error || !metadata) return <ModuleStateView state="error" errorMessage={error} />;
  return (
    <div style={pageStyle}>
      <PageHeader title={editing ? 'Editar Insumo' : 'Novo Insumo'} description="Cadastro separado do catálogo comercial: aqui ficam os itens comprados, armazenados e consumidos." back="/inventory/items" actions={<>
        <SecondaryButton onClick={() => navigate(-1)}>Cancelar</SecondaryButton>
        <PrimaryButton onClick={() => void save()} disabled={saving}><Save size={14} /> {saving ? 'Salvando...' : 'Salvar Insumo'}</PrimaryButton>
      </>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(280px,.7fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <DynamicFormRenderer schema={schema as DynamicFieldSchema[]} values={values} onChange={(key, value) => setValues(current => ({ ...current, [key]: value }))} showProgress highlightRequired />
        </div>
        <div style={{ ...cardStyle, padding: 18, position: 'sticky', top: 18 }}>
          <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Prévia</div>
          <h2 style={{ margin: '8px 0 2px', fontSize: 19 }}>{String(values.name || 'Nome do insumo')}</h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 12 }}>{String(values.sku || 'Sem SKU')}</p>
          <div style={{ marginTop: 16, padding: 13, borderRadius: 10, background: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>Estoque atual</span><strong>{editing ? Number(values.current_stock ?? 0) : 0} {String(values.unit_of_measure)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8 }}><span>Estoque mínimo</span><strong>{Number(values.minimum_stock ?? 0)} {String(values.unit_of_measure)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8 }}><span>Custo médio</span><strong>{money(Number(values.average_cost ?? 0))}</strong></div>
          </div>
          {!editing && <p style={{ color: '#64748B', fontSize: 11, lineHeight: 1.6 }}>Estoque atual e custo médio são atualizados exclusivamente pelas movimentações, preservando a rastreabilidade.</p>}
        </div>
      </div>
    </div>
  );
}

export function InventoryItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void Promise.all([inventoryService.getItem(id), inventoryService.listMovements({ itemId: id })])
      .then(([nextItem, nextMovements]) => { setItem(nextItem); setMovements(nextMovements); })
      .catch(() => setError('Insumo não encontrado.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ModuleStateView state="loading" />;
  if (error || !item) return <ModuleStateView state="error" errorMessage={error} />;
  const state = stockState(item);

  return (
    <div style={pageStyle}>
      <PageHeader title={item.name} description={item.description ?? 'Detalhes e posição de estoque do insumo.'} back="/inventory/items" actions={<>
        {hasPermission(INVENTORY_PERMISSIONS.update) && <SecondaryButton onClick={() => navigate(`/inventory/items/${item.id}/edit`)}><Edit size={14} /> Editar</SecondaryButton>}
        {hasPermission(INVENTORY_PERMISSIONS.move) && <PrimaryButton onClick={() => navigate(`/inventory/movements?new=1&item=${item.id}`)}><ArrowLeftRight size={14} /> Movimentar</PrimaryButton>}
      </>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(280px,.7fr)', gap: 16 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 14 }}>Dados gerais</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                ['SKU', item.sku ?? '—'], ['Categoria', item.categoryName ?? '—'], ['Fornecedor', item.supplierName ?? '—'],
                ['Unidade de medida', item.unitOfMeasure], ['Estoque mínimo', `${item.minimumStock} ${item.unitOfMeasure}`],
                ['Custo médio', money(item.averageCost)],
              ].map(([label, value]) => <div key={label}><div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div><div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>{value}</div></div>)}
            </div>
          </div>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Saldo por unidade</h2>
            {item.unitBalances.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 12 }}>Nenhum saldo registrado por unidade.</p> : item.unitBalances.map(balance => {
              const color = balance.currentStock <= 0 ? '#EF4444' : balance.currentStock <= item.minimumStock ? '#F59E0B' : '#10B981';
              return <div key={balance.unitId} style={{ padding: 13, marginTop: 8, background: '#F8FAFC', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong style={{ fontSize: 12 }}>{balance.unitName ?? `Unidade ${balance.unitId}`}</strong><strong style={{ color }}>{balance.currentStock} {item.unitOfMeasure}</strong></div>
                <div style={{ color: '#64748B', fontSize: 11, marginTop: 5 }}>Custo médio: {money(balance.averageCost)}</div>
              </div>;
            })}
          </div>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Últimas movimentações</h2>
            <DynamicTableRenderer columns={[
              { key: 'createdAt', label: 'Data', width: '120px', render: value => dateTime(String(value)) },
              { key: 'type', label: 'Tipo', width: '90px', render: value => { const cfg = MOVEMENT_TYPE_CONFIG[value as MovementType]; return <span style={{ color: cfg.color, background: cfg.bg, padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>; } },
              { key: 'quantity', label: 'Quantidade', width: '100px', render: (_, row) => `${MOVEMENT_TYPE_CONFIG[row.type as MovementType].sign}${Math.abs(Number(row.quantity))} ${item.unitOfMeasure}` },
              { key: 'unitName', label: 'Unidade', width: '130px' },
              { key: 'unitCost', label: 'Custo', width: '90px', render: value => money(Number(value ?? 0)) },
              { key: 'performedByName', label: 'Responsável', width: '120px' },
            ]} data={movements as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma movimentação para este insumo." />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div style={{ ...cardStyle, padding: 18 }}>
            <span style={{ color: state.color, background: state.bg, borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>{state.label}</span>
            <div style={{ fontSize: 30, fontWeight: 850, color: state.color, marginTop: 14 }}>{item.currentStock} <small style={{ fontSize: 14 }}>{item.unitOfMeasure}</small></div>
            <div style={{ color: '#64748B', fontSize: 12 }}>Valor estimado</div>
            <div style={{ fontSize: 21, fontWeight: 800, marginTop: 3 }}>{money(item.totalValue)}</div>
          </div>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14 }}>Histórico</h2>
            <div style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: 13, display: 'grid', gap: 13 }}>
              <div><strong style={{ fontSize: 12 }}>Insumo criado</strong><div style={{ color: '#94A3B8', fontSize: 10 }}>{dateTime(item.createdAt)}</div></div>
              <div><strong style={{ fontSize: 12 }}>Última atualização</strong><div style={{ color: '#94A3B8', fontSize: 10 }}>{dateTime(item.updatedAt)}</div></div>
              {movements.slice(0, 4).map(movement => <div key={movement.id}><strong style={{ fontSize: 12 }}>{MOVEMENT_TYPE_CONFIG[movement.type].label} de {movement.quantity} {item.unitOfMeasure}</strong><div style={{ color: '#94A3B8', fontSize: 10 }}>{dateTime(movement.createdAt)}</div></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return <div onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.45)', display: 'grid', placeItems: 'center', padding: 18 }}>
    <div style={{ width: 'min(540px,100%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 17, boxShadow: '0 24px 70px rgba(0,0,0,.2)' }}>
      <div style={{ padding: '17px 20px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>{title}</strong><button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X size={17} /></button></div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>;
}

function CrudPage<T extends InventoryCategory | InventorySupplier>({
  kind, title, description, records, loading, reload,
}: {
  kind: 'category' | 'supplier'; title: string; description: string; records: T[]; loading: boolean; reload: () => Promise<void>;
}) {
  const { hasPermission } = usePermission();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const isSupplier = kind === 'supplier';

  const showModal = (record?: T) => {
    setEditing(record ?? null);
    setForm(record ? { ...record } : { active: true, metadata: {} });
    setOpen(true);
  };
  const save = async () => {
    if (!form.name) { toast.error('Informe o nome.'); return; }
    try {
      if (kind === 'category') {
        if (editing) await inventoryService.updateCategory(editing.id, form);
        else await inventoryService.createCategory(form);
      } else {
        if (editing) await inventoryService.updateSupplier(editing.id, form);
        else await inventoryService.createSupplier(form);
      }
      toast.success(`${isSupplier ? 'Fornecedor' : 'Categoria'} salvo(a).`);
      setOpen(false); await reload();
    } catch { toast.error('Não foi possível salvar.'); }
  };
  const remove = async (record: T) => {
    if (!window.confirm(`Excluir "${record.name}"?`)) return;
    try {
      if (kind === 'category') await inventoryService.deleteCategory(record.id);
      else await inventoryService.deleteSupplier(record.id);
      toast.success('Registro excluído.'); await reload();
    } catch { toast.error('Não foi possível excluir.'); }
  };

  const columns: ColumnDef[] = isSupplier ? [
    { key: 'name', label: 'Fornecedor', type: 'avatar', width: '190px', sortable: true },
    { key: 'document', label: 'Documento', width: '140px', render: value => <span style={{ fontFamily: 'monospace' }}>{String(value ?? '—')}</span> },
    { key: 'phone', label: 'Telefone', width: '120px' },
    { key: 'email', label: 'E-mail', width: '170px' },
    { key: 'contactName', label: 'Contato', width: '130px' },
    { key: 'active', label: 'Status', width: '90px', render: value => value ? 'Ativo' : 'Inativo' },
  ] : [
    { key: 'name', label: 'Categoria', sortable: true, width: '180px' },
    { key: 'description', label: 'Descrição', width: '350px' },
    { key: 'active', label: 'Status', width: '90px', render: value => value ? 'Ativa' : 'Inativa' },
  ];

  return <div style={pageStyle}>
    <PageHeader title={title} description={description} back="/inventory" icon={isSupplier ? <Truck size={21} /> : <Package size={21} />} actions={
      hasPermission(INVENTORY_PERMISSIONS.create) ? <PrimaryButton onClick={() => showModal()}><Plus size={14} /> Novo{isSupplier ? ' Fornecedor' : 'a Categoria'}</PrimaryButton> : undefined
    } />
    <DynamicTableRenderer columns={columns} data={records as unknown as Record<string, unknown>[]} loading={loading} emptyMessage={`Nenhum${isSupplier ? ' fornecedor' : 'a categoria'} cadastrado(a).`} actions={[
      { label: 'Editar', icon: <Edit size={13} />, onClick: row => showModal(row as unknown as T), showCondition: () => hasPermission(INVENTORY_PERMISSIONS.update) },
      { label: 'Excluir', icon: <Trash2 size={13} />, variant: 'danger', onClick: row => void remove(row as unknown as T), showCondition: () => hasPermission(INVENTORY_PERMISSIONS.delete) },
    ]} />
    <Modal title={`${editing ? 'Editar' : 'Novo'} ${isSupplier ? 'Fornecedor' : 'Categoria'}`} open={open} onClose={() => setOpen(false)}>
      <div style={{ display: 'grid', gap: 13 }}>
        <label style={{ fontSize: 12, fontWeight: 650 }}>Nome<input value={String(form.name ?? '')} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
        {isSupplier ? <>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Documento<input value={String(form.document ?? '')} onChange={e => setForm(current => ({ ...current, document: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 650 }}>Telefone<input value={String(form.phone ?? '')} onChange={e => setForm(current => ({ ...current, phone: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
            <label style={{ fontSize: 12, fontWeight: 650 }}>E-mail<input value={String(form.email ?? '')} onChange={e => setForm(current => ({ ...current, email: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
          </div>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Contato principal<input value={String(form.contactName ?? '')} onChange={e => setForm(current => ({ ...current, contactName: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Prazo de entrega (dias)<input type="number" value={String((form.metadata as Record<string, unknown> | undefined)?.delivery_days ?? '')} onChange={e => setForm(current => ({ ...current, metadata: { ...(current.metadata as object ?? {}), delivery_days: Number(e.target.value) } }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
        </> : <label style={{ fontSize: 12, fontWeight: 650 }}>Descrição<textarea value={String(form.description ?? '')} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} style={{ ...inputStyle, marginTop: 5, minHeight: 90 }} /></label>}
        <label style={{ display: 'flex', gap: 8, fontSize: 12 }}><input type="checkbox" checked={Boolean(form.active)} onChange={e => setForm(current => ({ ...current, active: e.target.checked }))} /> Ativo</label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><SecondaryButton onClick={() => setOpen(false)}>Cancelar</SecondaryButton><PrimaryButton onClick={() => void save()}><Save size={13} /> Salvar</PrimaryButton></div>
      </div>
    </Modal>
  </div>;
}

export function InventoryCategories() {
  const { categories, loading, error, reload } = useInventoryData();
  if (error) return <ModuleStateView state="error" errorMessage={error} />;
  return <CrudPage kind="category" title="Categorias" description="Organize matérias-primas, embalagens, descartáveis e demais insumos." records={categories} loading={loading} reload={reload} />;
}

export function InventorySuppliers() {
  const { suppliers, loading, error, reload } = useInventoryData();
  if (error) return <ModuleStateView state="error" errorMessage={error} />;
  return <CrudPage kind="supplier" title="Fornecedores" description="Cadastre os parceiros que abastecem a operação." records={suppliers} loading={loading} reload={reload} />;
}

export function InventoryLocations() {
  const { hasPermission } = usePermission();
  const settingsState = useInventorySettings();
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockLocation | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({ active: true, type: 'warehouse', metadata: {} });

  const reload = async () => {
    setLoading(true);
    try {
      const [nextLocations, nextUnits] = await Promise.all([
        inventoryService.listLocations(),
        unitManagementService.getUnitOptions(),
      ]);
      setLocations(nextLocations);
      setUnits(nextUnits);
    } catch {
      toast.error('Nao foi possivel carregar os locais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (settingsState.settings?.inventory_enabled) void reload(); }, [settingsState.settings?.inventory_enabled]);

  const showModal = (location?: StockLocation) => {
    setEditing(location ?? null);
    setForm(location ? {
      unitId: location.unitId,
      name: location.name,
      code: location.code,
      type: location.type,
      isDefault: location.isDefault,
      active: location.active,
      metadata: location.metadata,
    } : { active: true, type: 'warehouse', isDefault: false, metadata: {} });
    setOpen(true);
  };

  const save = async () => {
    if (!form.unitId || !form.name || !form.code) {
      toast.error('Informe unidade, nome e codigo.');
      return;
    }
    try {
      if (editing) await inventoryService.updateLocation(editing.id, form);
      else await inventoryService.createLocation(form);
      toast.success('Local salvo.');
      setOpen(false);
      await reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel salvar o local.'));
    }
  };

  const archive = async (location: StockLocation) => {
    try {
      await inventoryService.updateLocation(location.id, { ...location, active: false });
      toast.success('Local arquivado.');
      await reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel arquivar o local.'));
    }
  };

  const columns: ColumnDef[] = [
    { key: 'name', label: term(settingsState.settings, 'location'), sortable: true, width: '180px', render: (_, row) => <div><strong>{String(row.name)}</strong><div style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}>{String(row.code)}</div></div> },
    { key: 'unitName', label: 'Unidade', width: '150px' },
    { key: 'type', label: 'Tipo', width: '110px' },
    { key: 'isDefault', label: 'Default', width: '90px', render: value => value ? 'Sim' : 'Nao' },
    { key: 'active', label: 'Status', width: '90px', render: value => <span style={{ color: value ? '#10B981' : '#64748B', background: value ? '#ECFDF5' : '#F1F5F9', borderRadius: 99, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>{value ? 'Ativo' : 'Arquivado'}</span> },
  ];

  return <InventoryCapabilityState {...settingsState}>
    <div style={pageStyle}>
      <PageHeader title={term(settingsState.settings, 'locationPlural')} description="Locais fisicos ou logicos usados pela Inventory Foundation." back="/inventory" icon={<MapPin size={21} />} actions={
        hasPermission(INVENTORY_PERMISSIONS.locationsManage) ? <PrimaryButton onClick={() => showModal()}><Plus size={14} /> Novo {term(settingsState.settings, 'location')}</PrimaryButton> : undefined
      } />
      <DynamicTableRenderer columns={columns} data={locations as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Nenhum local cadastrado." actions={[
        { label: 'Editar', icon: <Edit size={13} />, onClick: row => showModal(row as unknown as StockLocation), showCondition: () => hasPermission(INVENTORY_PERMISSIONS.locationsManage) },
        { label: 'Arquivar', icon: <Trash2 size={13} />, variant: 'danger', onClick: row => void archive(row as unknown as StockLocation), showCondition: row => hasPermission(INVENTORY_PERMISSIONS.locationsManage) && Boolean(row.active) },
      ]} />
      <Modal title={`${editing ? 'Editar' : 'Novo'} ${term(settingsState.settings, 'location')}`} open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'grid', gap: 13 }}>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Unidade<select value={String(form.unitId ?? '')} onChange={e => setForm(current => ({ ...current, unitId: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }}><option value="">Selecione...</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Nome<input value={String(form.name ?? '')} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 650 }}>Codigo<input value={String(form.code ?? '')} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
            <label style={{ fontSize: 12, fontWeight: 650 }}>Tipo<select value={String(form.type ?? 'warehouse')} onChange={e => setForm(current => ({ ...current, type: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }}><option value="default">Default</option><option value="warehouse">Deposito</option><option value="shelf">Prateleira</option><option value="vehicle">Veiculo</option><option value="virtual">Virtual</option></select></label>
          </div>
          <label style={{ display: 'flex', gap: 8, fontSize: 12 }}><input type="checkbox" checked={Boolean(form.isDefault)} onChange={e => setForm(current => ({ ...current, isDefault: e.target.checked }))} /> Local default da unidade</label>
          <label style={{ display: 'flex', gap: 8, fontSize: 12 }}><input type="checkbox" checked={Boolean(form.active)} onChange={e => setForm(current => ({ ...current, active: e.target.checked }))} /> Ativo</label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><SecondaryButton onClick={() => setOpen(false)}>Cancelar</SecondaryButton><PrimaryButton onClick={() => void save()}><Save size={13} /> Salvar</PrimaryButton></div>
        </div>
      </Modal>
    </div>
  </InventoryCapabilityState>;
}

export function InventoryBalances() {
  const { hasPermission } = usePermission();
  const settingsState = useInventorySettings();
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [filters, setFilters] = useState({ itemId: '', unitId: '', locationId: '', stockStatus: '' as '' | 'low' | 'out' | 'available' });
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [nextBalances, nextItems, nextLocations, nextUnits] = await Promise.all([
        inventoryService.listBalances(filters),
        inventoryService.listItems(),
        inventoryService.listLocations(),
        unitManagementService.getUnitOptions(),
      ]);
      setBalances(nextBalances);
      setItems(nextItems);
      setLocations(nextLocations);
      setUnits(nextUnits);
    } catch {
      toast.error('Nao foi possivel carregar os saldos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (settingsState.settings?.inventory_enabled) void reload(); }, [settingsState.settings?.inventory_enabled, filters.itemId, filters.unitId, filters.locationId, filters.stockStatus]);

  const columns: ColumnDef[] = [
    { key: 'itemName', label: term(settingsState.settings, 'item'), width: '190px' },
    { key: 'unitName', label: 'Unidade', width: '140px' },
    { key: 'locationName', label: term(settingsState.settings, 'location'), width: '150px' },
    { key: 'onHand', label: 'On hand', type: 'number', width: '95px' },
    { key: 'reserved', label: 'Reserved', type: 'number', width: '95px' },
    { key: 'blocked', label: 'Blocked', type: 'number', width: '95px' },
    { key: 'available', label: 'Available', type: 'number', width: '95px', render: value => <strong style={{ color: Number(value) <= 0 ? '#EF4444' : '#10B981' }}>{Number(value)}</strong> },
    ...(hasPermission(INVENTORY_PERMISSIONS.costView) ? [{ key: 'averageCost', label: 'Custo medio', width: '110px', render: (value: unknown) => money(Number(value ?? 0)) }] : []),
  ];

  return <InventoryCapabilityState {...settingsState}>
    <div style={pageStyle}>
      <PageHeader title={term(settingsState.settings, 'balancePlural')} description="Projecao atual derivada do ledger. Esta tela e somente leitura." back="/inventory" icon={<Boxes size={21} />} />
      <div style={{ ...cardStyle, padding: 13, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(4,minmax(130px,1fr))', gap: 9 }}>
        <select value={filters.itemId} onChange={e => setFilters(current => ({ ...current, itemId: e.target.value }))} style={inputStyle}><option value="">Todos os itens</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={filters.unitId} onChange={e => setFilters(current => ({ ...current, unitId: e.target.value }))} style={inputStyle}><option value="">Todas as unidades</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select>
        <select value={filters.locationId} onChange={e => setFilters(current => ({ ...current, locationId: e.target.value }))} style={inputStyle}><option value="">Todos os locais</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
        <select value={filters.stockStatus} onChange={e => setFilters(current => ({ ...current, stockStatus: e.target.value as typeof filters.stockStatus }))} style={inputStyle}><option value="">Todos os status</option><option value="available">Disponivel</option><option value="low">Baixo</option><option value="out">Zerado</option></select>
      </div>
      <DynamicTableRenderer columns={columns} data={balances as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Nenhum saldo projetado." />
    </div>
  </InventoryCapabilityState>;
}
export function InventoryMovements() {
  const { hasPermission } = usePermission();
  const settingsState = useInventorySettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(searchParams.get('new') === '1');
  const [detail, setDetail] = useState<InventoryMovement | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [filters, setFilters] = useState({ itemId: '', unitId: '', locationId: '', type: '' as MovementType | '', dateFrom: '', dateTo: '' });
  const [form, setForm] = useState<Record<string, unknown>>({
    itemId: searchParams.get('item') ?? '', type: searchParams.get('type') ?? 'entry',
    unitId: '', locationId: '', quantity: '', unitCost: '', reference: '', reason: '',
  });

  const reload = async () => {
    setLoading(true);
    try {
      const [nextMovements, nextItems, nextUnits, nextLocations] = await Promise.all([
        inventoryService.listMovements(filters), inventoryService.listItems(), unitManagementService.getUnitOptions(), inventoryService.listLocations(),
      ]);
      setMovements(nextMovements); setItems(nextItems); setUnits(nextUnits); setLocations(nextLocations);
    } catch { toast.error('Nao foi possivel carregar as movimentacoes.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (settingsState.settings?.inventory_enabled) void reload(); }, [settingsState.settings?.inventory_enabled, filters.itemId, filters.unitId, filters.locationId, filters.type, filters.dateFrom, filters.dateTo]);

  const selectedType = form.type as MovementType;
  const selectedItem = items.find(item => item.id === String(form.itemId));
  const selectedLocation = locations.find(location => location.id === String(form.locationId));
  const visibleMovementTypes: MovementType[] = ['entry', 'exit', 'positive_adjustment', 'negative_adjustment', 'loss'];
  const commandPermission = selectedType === 'entry' || selectedType === 'positive_adjustment'
    ? INVENTORY_PERMISSIONS.entryCreate
    : selectedType === 'exit' || selectedType === 'loss'
      ? INVENTORY_PERMISSIONS.exitCreate
      : INVENTORY_PERMISSIONS.adjustCreate;

  const save = async () => {
    if (!form.itemId || !form.quantity) { toast.error(`Selecione o ${term(settingsState.settings, 'item').toLowerCase()} e informe a quantidade.`); return; }
    if (!hasPermission(commandPermission)) { toast.error('Voce nao tem permissao para registrar este movimento.'); return; }
    if (['positive_adjustment', 'negative_adjustment', 'loss'].includes(selectedType) && !form.reason) { toast.error('Informe o motivo.'); return; }
    if (selectedLocation && !selectedLocation.active) { toast.error('Local inativo nao pode receber movimento.'); return; }
    if (selectedItem && !selectedItem.trackInventory) { toast.error('Item nao estocavel nao pode gerar movimento fisico.'); return; }
    const locationField = selectedType === 'entry' || selectedType === 'positive_adjustment' ? 'destinationLocationId' : 'sourceLocationId';
    try {
      await inventoryService.createMovement({
        type: selectedType,
        unitId: form.unitId || null,
        [locationField]: form.locationId || null,
        reference: form.reference,
        reason: form.reason,
        sourceType: 'manual',
        items: [{ itemId: form.itemId, quantity: form.quantity, unitCost: form.unitCost, metadata: {} }],
      });
      toast.success('Movimento registrado.');
      setOpen(false); setSearchParams({}); await reload();
    } catch (error) { toast.error(getApiErrorMessage(error, 'Nao foi possivel registrar. Verifique capability, saldo e dados informados.')); }
  };

  const reverse = async () => {
    if (!detail || !reverseReason) { toast.error('Informe o motivo do estorno.'); return; }
    try {
      await inventoryService.reverseMovement(detail.id, reverseReason);
      toast.success('Movimento estornado.');
      setDetail(null); setReverseReason(''); await reload();
    } catch (error) { toast.error(getApiErrorMessage(error, 'Nao foi possivel estornar o movimento.')); }
  };

  const columns: ColumnDef[] = [
    { key: 'createdAt', label: 'Data/Hora', width: '130px', render: value => dateTime(String(value)) },
    { key: 'type', label: 'Tipo', width: '120px', render: value => { const cfg = MOVEMENT_TYPE_CONFIG[value as MovementType]; return <span style={{ color: cfg.color, background: cfg.bg, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>; } },
    { key: 'number', label: 'Numero', width: '125px' },
    { key: 'itemName', label: term(settingsState.settings, 'item'), sortable: true, width: '190px', render: (_, row) => {
      const movement = row as unknown as InventoryMovement;
      return <div><strong>{movement.items?.map(item => item.itemName).join(', ') || movement.itemName}</strong><div style={{ color: '#94A3B8', fontSize: 10 }}>{movement.items?.length ?? 1} linha(s)</div></div>;
    } },
    { key: 'unitName', label: 'Unidade', width: '130px' },
    { key: 'quantity', label: 'Quantidade', width: '110px', render: (_, row) => { const movement = row as unknown as InventoryMovement; const cfg = MOVEMENT_TYPE_CONFIG[movement.type]; return <strong style={{ color: cfg.color }}>{cfg.sign}{Math.abs(movement.quantity)} {movement.itemUnit}</strong>; } },
    ...(hasPermission(INVENTORY_PERMISSIONS.costView) ? [
      { key: 'unitCost', label: 'Custo Unit.', width: '100px', render: (value: unknown) => money(Number(value ?? 0)) },
      { key: 'totalCost', label: 'Total', width: '100px', render: (value: unknown) => money(Number(value ?? 0)) },
    ] : []),
    { key: 'sourceType', label: 'Origem', width: '120px', render: value => String(value ?? 'manual') },
    { key: 'reference', label: 'Referencia', width: '110px' },
  ];

  return <InventoryCapabilityState {...settingsState}>
    <div style={pageStyle}>
      <PageHeader title={term(settingsState.settings, 'movementPlural')} description="Ledger confirmado de entradas, saidas, ajustes, perdas e reversoes." back="/inventory" actions={
        hasPermission(INVENTORY_PERMISSIONS.entryCreate) ? <PrimaryButton onClick={() => setOpen(true)}><Plus size={14} /> Novo {term(settingsState.settings, 'movement')}</PrimaryButton> : undefined
      } />
      <div style={{ ...cardStyle, padding: 13, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(6,minmax(120px,1fr))', gap: 9 }}>
        <select value={filters.itemId} onChange={e => setFilters(current => ({ ...current, itemId: e.target.value }))} style={inputStyle}><option value="">Todos os itens</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={filters.unitId} onChange={e => setFilters(current => ({ ...current, unitId: e.target.value }))} style={inputStyle}><option value="">Todas as unidades</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select>
        <select value={filters.locationId} onChange={e => setFilters(current => ({ ...current, locationId: e.target.value }))} style={inputStyle}><option value="">Todos os locais</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
        <select value={filters.type} onChange={e => setFilters(current => ({ ...current, type: e.target.value as MovementType | '' }))} style={inputStyle}><option value="">Todos os tipos</option>{visibleMovementTypes.concat('reversal').map(type => <option key={type} value={type}>{MOVEMENT_TYPE_CONFIG[type].label}</option>)}</select>
        <input type="date" value={filters.dateFrom} onChange={e => setFilters(current => ({ ...current, dateFrom: e.target.value }))} style={inputStyle} />
        <input type="date" value={filters.dateTo} onChange={e => setFilters(current => ({ ...current, dateTo: e.target.value }))} style={inputStyle} />
      </div>
      <DynamicTableRenderer columns={columns} data={movements as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Nenhum movimento encontrado." onRowClick={row => setDetail(row as unknown as InventoryMovement)} actions={[
        { label: 'Detalhe', icon: <Eye size={13} />, onClick: row => setDetail(row as unknown as InventoryMovement) },
      ]} />
      <Modal title={`Novo ${term(settingsState.settings, 'movement')}`} open={open} onClose={() => { setOpen(false); setSearchParams({}); }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {visibleMovementTypes.map(type => {
              const cfg = MOVEMENT_TYPE_CONFIG[type];
              const permission = type === 'entry' || type === 'positive_adjustment' ? INVENTORY_PERMISSIONS.entryCreate : type === 'exit' || type === 'loss' ? INVENTORY_PERMISSIONS.exitCreate : INVENTORY_PERMISSIONS.adjustCreate;
              const disabled = !hasPermission(permission);
              return <button key={type} disabled={disabled} onClick={() => setForm(current => ({ ...current, type }))} style={{ padding: 11, borderRadius: 10, border: selectedType === type ? `2px solid ${cfg.color}` : '1px solid #E2E8F0', background: selectedType === type ? cfg.bg : '#fff', color: cfg.color, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .45 : 1 }}>{cfg.sign} {cfg.label}{disabled ? ' - Sem permissao' : ''}</button>;
            })}
          </div>
          <label style={{ fontSize: 12, fontWeight: 650 }}>{term(settingsState.settings, 'item')}<select value={String(form.itemId)} onChange={e => setForm(current => ({ ...current, itemId: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }}><option value="">Selecione...</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}{item.catalogItemId ? ' - Catalog' : ' - Interno'}</option>)}</select></label>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Unidade<select value={String(form.unitId)} onChange={e => setForm(current => ({ ...current, unitId: e.target.value, locationId: '' }))} style={{ ...inputStyle, marginTop: 5 }}><option value="">Resolver automaticamente</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
          {settingsState.settings?.inventory_mode !== 'simple' && <label style={{ fontSize: 12, fontWeight: 650 }}>{term(settingsState.settings, 'location')}<select value={String(form.locationId)} onChange={e => setForm(current => ({ ...current, locationId: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }}><option value="">Local default</option>{locations.filter(location => !form.unitId || location.unitId === String(form.unitId)).map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
          <div style={{ display: 'grid', gridTemplateColumns: selectedType === 'exit' || selectedType === 'loss' || selectedType === 'negative_adjustment' ? '1fr' : '1fr 1fr', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 650 }}>Quantidade ({selectedItem?.unitOfMeasure ?? 'un'})<input type="number" step=".0001" value={String(form.quantity)} onChange={e => setForm(current => ({ ...current, quantity: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
            {selectedType !== 'exit' && selectedType !== 'loss' && selectedType !== 'negative_adjustment' && <label style={{ fontSize: 12, fontWeight: 650 }}>Custo unitario<input type="number" step=".0001" value={String(form.unitCost)} onChange={e => setForm(current => ({ ...current, unitCost: e.target.value }))} placeholder={String(selectedItem?.averageCost ?? 0)} style={{ ...inputStyle, marginTop: 5 }} /></label>}
          </div>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Referencia<input value={String(form.reference)} onChange={e => setForm(current => ({ ...current, reference: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Motivo {['positive_adjustment', 'negative_adjustment', 'loss'].includes(selectedType) && '*'}<textarea value={String(form.reason)} onChange={e => setForm(current => ({ ...current, reason: e.target.value }))} style={{ ...inputStyle, marginTop: 5, minHeight: 80 }} /></label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><SecondaryButton onClick={() => setOpen(false)}>Cancelar</SecondaryButton><PrimaryButton onClick={() => void save()}><CheckCircle size={14} /> Registrar</PrimaryButton></div>
        </div>
      </Modal>
      <Modal title={detail?.number ? `Movimento ${detail.number}` : 'Detalhe do movimento'} open={Boolean(detail)} onClose={() => { setDetail(null); setReverseReason(''); }}>
        {detail && <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            <div><strong>Tipo</strong><br />{MOVEMENT_TYPE_CONFIG[detail.type].label}</div>
            <div><strong>Status</strong><br />{detail.status ?? 'confirmed'}</div>
            <div><strong>Unidade</strong><br />{detail.unitName ?? '-'}</div>
            <div><strong>Origem</strong><br />{detail.sourceType ?? 'manual'}</div>
            <div><strong>Referencia</strong><br />{detail.reference ?? '-'}</div>
            <div><strong>Horario</strong><br />{dateTime(detail.createdAt)}</div>
          </div>
          <div style={{ ...cardStyle, padding: 12 }}>
            {(detail.items?.length ? detail.items : [{ itemId: detail.itemId, itemName: detail.itemName, quantity: detail.quantity, unitCost: detail.unitCost, totalCost: detail.totalCost, unitOfMeasure: detail.itemUnit }]).map(item => <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid #F1F5F9' }}><span>{item.itemName}</span><strong>{item.quantity} {item.unitOfMeasure ?? ''}</strong></div>)}
          </div>
          {hasPermission(INVENTORY_PERMISSIONS.reverse) && detail.status !== 'reversed' && detail.type !== 'reversal' && <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 650 }}>Motivo do estorno<textarea value={reverseReason} onChange={e => setReverseReason(e.target.value)} style={{ ...inputStyle, marginTop: 5, minHeight: 70 }} /></label>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><SecondaryButton onClick={() => void reverse()}><RotateCcw size={13} /> Estornar</SecondaryButton></div>
          </div>}
        </div>}
      </Modal>
    </div>
  </InventoryCapabilityState>;
}
export function InventorySettings() {
  const entities = [
    ['inventory_items', 'Itens'], ['stock_locations', 'Locais'], ['stock_movements', 'Movimentos'], ['inventory_suppliers', 'Fornecedores'], ['inventory_categories', 'Categorias'],
  ] as const;
  const settingsState = useInventorySettings();
  const [activeEntity, setActiveEntity] = useState<InventoryMetadata['entity_key']>('inventory_items');
  const [metadata, setMetadata] = useState<InventoryMetadata | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<InventorySettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSettingsForm(settingsState.settings ?? {});
  }, [settingsState.settings]);

  useEffect(() => {
    setLoading(true);
    void inventoryService.getMetadata(activeEntity).then(value => setMetadata(normalizedMetadata(value)))
      .catch(() => toast.error('Nao foi possivel carregar as configuracoes.')).finally(() => setLoading(false));
  }, [activeEntity]);

  const terminology = (settingsForm.terminology_json ?? settingsForm.terminology ?? {}) as Record<string, unknown>;
  const patchTerm = (key: string, value: string) => setSettingsForm(current => ({
    ...current,
    terminology_json: { ...((current.terminology_json ?? current.terminology ?? {}) as Record<string, unknown>), [key]: value },
  }));
  const patchField = (key: string, patch: Partial<DynamicFieldSchema>) => setMetadata(current => current ? ({
    ...current, fields: current.fields.map(field => String(field.key) === key ? { ...field, ...patch } : field),
  }) : current);
  const save = async () => {
    if (!metadata) return;
    try {
      await inventoryService.updateSettings(settingsForm);
      setMetadata(normalizedMetadata(await inventoryService.updateMetadata(activeEntity, metadata)));
      await settingsState.reload();
      toast.success('Configuracoes salvas.');
    }
    catch (error) { toast.error(getApiErrorMessage(error, 'Nao foi possivel salvar as configuracoes.')); }
  };

  if (settingsState.loading) return <ModuleStateView state="loading" />;
  if (settingsState.error) return <ModuleStateView state="error" errorMessage={settingsState.error} />;

  return <div style={pageStyle}>
    <PageHeader title={`Configuracoes de ${term(settingsState.settings, 'module')}`} description="Capability, terminologia e campos controlados pelo tenant." back="/inventory" icon={<Settings size={21} />} actions={<PrimaryButton onClick={() => void save()} disabled={!metadata}><Save size={14} /> Salvar</PrimaryButton>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,.7fr) minmax(0,1.3fr)', gap: 16, alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Capability</h2>
          <label style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 12 }}><input type="checkbox" checked={Boolean(settingsForm.inventory_enabled)} onChange={e => setSettingsForm(current => ({ ...current, inventory_enabled: e.target.checked }))} /> Inventory habilitado</label>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Modo<select value={String(settingsForm.inventory_mode ?? 'simple')} onChange={e => setSettingsForm(current => ({ ...current, inventory_mode: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }}><option value="simple">Simples</option><option value="intermediate">Intermediario</option><option value="advanced">Avancado</option></select></label>
          <p style={{ color: '#64748B', fontSize: 11, lineHeight: 1.5 }}>Transferencias, contagens, reservas e automacoes permanecem fora da Fase 1B.</p>
        </div>
        <div style={{ ...cardStyle, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Terminologia</h2>
          {[
            ['inventory.module.singular', 'Modulo'], ['inventory.item.singular', 'Item'], ['inventory.item.plural', 'Itens'],
            ['inventory.location.singular', 'Local'], ['inventory.balance.singular', 'Saldo'], ['inventory.movement.singular', 'Movimento'],
            ['inventory.entry.singular', 'Entrada'], ['inventory.exit.singular', 'Saida'], ['inventory.adjustment.singular', 'Ajuste'],
          ].map(([key, label]) => <label key={key} style={{ display: 'block', fontSize: 12, fontWeight: 650, marginTop: 9 }}>{label}<input value={String(terminology[key] ?? '')} placeholder={label} onChange={e => patchTerm(key, e.target.value)} style={{ ...inputStyle, marginTop: 5 }} /></label>)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 10, alignSelf: 'start' }}>{entities.map(([key, label]) => <button key={key} onClick={() => setActiveEntity(key)} style={{ display: 'block', width: '100%', border: 0, borderRadius: 9, padding: '10px 12px', textAlign: 'left', background: activeEntity === key ? '#EEF2FF' : 'transparent', color: activeEntity === key ? '#4F46E5' : '#64748B', fontWeight: 700, cursor: 'pointer' }}>{label}</button>)}</div>
        {loading ? <ModuleStateView state="loading" /> : metadata && <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Labels da entidade</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 650 }}>Singular<input value={metadata.singular_label} onChange={e => setMetadata(current => current ? ({ ...current, singular_label: e.target.value }) : current)} style={{ ...inputStyle, marginTop: 5 }} /></label>
              <label style={{ fontSize: 12, fontWeight: 650 }}>Plural<input value={metadata.plural_label} onChange={e => setMetadata(current => current ? ({ ...current, plural_label: e.target.value }) : current)} style={{ ...inputStyle, marginTop: 5 }} /></label>
            </div>
          </div>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Campos customizados</h2>
            {[...metadata.fields].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)).map(field => <div key={String(field.key)} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 80px', gap: 10, alignItems: 'center', padding: '9px 0', borderTop: '1px solid #F1F5F9' }}>
              <input value={field.label} onChange={e => patchField(String(field.key), { label: e.target.value })} style={inputStyle} />
              <label style={{ fontSize: 11 }}><input type="checkbox" checked={field.visible !== false} onChange={e => patchField(String(field.key), { visible: e.target.checked })} /> Visivel</label>
              <label style={{ fontSize: 11 }}><input type="checkbox" checked={Boolean(field.required)} onChange={e => patchField(String(field.key), { required: e.target.checked })} /> Obrigatorio</label>
              <input type="number" value={Number(field.order ?? 0)} onChange={e => patchField(String(field.key), { order: Number(e.target.value) })} style={inputStyle} />
            </div>)}
          </div>
          <div style={{ ...cardStyle, padding: 18 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Colunas da tabela</h2>
            {metadata.table_columns.map(column => <label key={column.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid #F1F5F9', fontSize: 12 }}><span>{column.label}</span><input type="checkbox" checked={column.visible !== false} onChange={e => setMetadata(current => current ? ({ ...current, table_columns: current.table_columns.map(item => item.key === column.key ? { ...item, visible: e.target.checked } : item) }) : current)} /></label>)}
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

