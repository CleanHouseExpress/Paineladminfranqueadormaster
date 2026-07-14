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

export function InventoryMovements() {
  const { hasPermission } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(searchParams.get('new') === '1');
  const [filters, setFilters] = useState({ itemId: '', unitId: '', type: '' as MovementType | '', dateFrom: '', dateTo: '' });
  const [form, setForm] = useState<Record<string, unknown>>({
    itemId: searchParams.get('item') ?? '', type: searchParams.get('type') ?? 'entry',
    unitId: '', quantity: '', unitCost: '', reference: '', notes: '',
  });

  const reload = async () => {
    setLoading(true);
    try {
      const [nextMovements, nextItems, nextUnits] = await Promise.all([
        inventoryService.listMovements(filters), inventoryService.listItems(), unitManagementService.getUnitOptions(),
      ]);
      setMovements(nextMovements); setItems(nextItems); setUnits(nextUnits);
    } catch { toast.error('Não foi possível carregar as movimentações.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, [filters.itemId, filters.unitId, filters.type, filters.dateFrom, filters.dateTo]);

  const selectedType = form.type as MovementType;
  const selectedItem = items.find(item => item.id === String(form.itemId));
  const save = async () => {
    if (!form.itemId || !form.quantity) { toast.error('Selecione o insumo e informe a quantidade.'); return; }
    if (selectedType === 'adjustment' && !hasPermission(INVENTORY_PERMISSIONS.adjust)) { toast.error('Você não tem permissão para realizar ajustes.'); return; }
    if (['adjustment', 'loss'].includes(selectedType) && !form.notes) { toast.error('Informe o motivo em observações.'); return; }
    try {
      await inventoryService.createMovement(form);
      toast.success('Movimentação registrada.');
      setOpen(false); setSearchParams({}); await reload();
    } catch { toast.error('Não foi possível registrar. Verifique o saldo e os dados informados.'); }
  };

  const columns: ColumnDef[] = [
    { key: 'createdAt', label: 'Data/Hora', width: '130px', render: value => dateTime(String(value)) },
    { key: 'type', label: 'Tipo', width: '100px', render: value => { const cfg = MOVEMENT_TYPE_CONFIG[value as MovementType]; return <span style={{ color: cfg.color, background: cfg.bg, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>; } },
    { key: 'itemName', label: 'Insumo', sortable: true, width: '170px' },
    { key: 'unitName', label: 'Unidade', width: '130px' },
    { key: 'quantity', label: 'Quantidade', width: '110px', render: (_, row) => { const movement = row as unknown as InventoryMovement; const cfg = MOVEMENT_TYPE_CONFIG[movement.type]; return <strong style={{ color: cfg.color }}>{cfg.sign}{Math.abs(movement.quantity)} {movement.itemUnit}</strong>; } },
    { key: 'unitCost', label: 'Custo Unit.', width: '100px', render: value => money(Number(value ?? 0)) },
    { key: 'totalCost', label: 'Total', width: '100px', render: value => money(Number(value ?? 0)) },
    { key: 'performedByName', label: 'Responsável', width: '120px' },
    {
      key: 'originType',
      label: 'Origem',
      width: '150px',
      render: (_, row) => {
        const movement = row as unknown as InventoryMovement;
        if (movement.originType !== 'checklist_execution') {
          return <span style={{ color: '#94A3B8' }}>Manual</span>;
        }
        return (
          <div>
            <span style={{ color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
              Checklist #{movement.originId}
            </span>
            {movement.originFieldKey && (
              <div style={{ marginTop: 3, color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}>
                {movement.originFieldKey}
              </div>
            )}
          </div>
        );
      },
    },
    { key: 'reference', label: 'Referência', width: '110px' },
  ];

  return <div style={pageStyle}>
    <PageHeader title="Movimentações" description="Entradas, saídas, ajustes e perdas com atualização automática de saldo e custo médio." back="/inventory" actions={
      hasPermission(INVENTORY_PERMISSIONS.move) ? <PrimaryButton onClick={() => setOpen(true)}><Plus size={14} /> Nova Movimentação</PrimaryButton> : undefined
    } />
    <div style={{ ...cardStyle, padding: 13, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(5,minmax(130px,1fr))', gap: 9 }}>
      <select value={filters.itemId} onChange={e => setFilters(current => ({ ...current, itemId: e.target.value }))} style={inputStyle}><option value="">Todos os insumos</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={filters.unitId} onChange={e => setFilters(current => ({ ...current, unitId: e.target.value }))} style={inputStyle}><option value="">Todas as unidades</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select>
      <select value={filters.type} onChange={e => setFilters(current => ({ ...current, type: e.target.value as MovementType | '' }))} style={inputStyle}><option value="">Todos os tipos</option>{Object.entries(MOVEMENT_TYPE_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}</select>
      <input type="date" value={filters.dateFrom} onChange={e => setFilters(current => ({ ...current, dateFrom: e.target.value }))} style={inputStyle} />
      <input type="date" value={filters.dateTo} onChange={e => setFilters(current => ({ ...current, dateTo: e.target.value }))} style={inputStyle} />
    </div>
    <DynamicTableRenderer columns={columns} data={movements as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Nenhuma movimentação encontrada." />
    <Modal title="Nova Movimentação" open={open} onClose={() => { setOpen(false); setSearchParams({}); }}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {(Object.keys(MOVEMENT_TYPE_CONFIG) as MovementType[]).map(type => {
            const cfg = MOVEMENT_TYPE_CONFIG[type];
            const disabled = type === 'transfer' || type === 'reversal' || (type === 'adjustment' && !hasPermission(INVENTORY_PERMISSIONS.adjust));
            return <button key={type} disabled={disabled} onClick={() => setForm(current => ({ ...current, type }))} style={{ padding: 11, borderRadius: 10, border: selectedType === type ? `2px solid ${cfg.color}` : '1px solid #E2E8F0', background: selectedType === type ? cfg.bg : '#fff', color: cfg.color, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .45 : 1 }}>{cfg.sign} {cfg.label}{type === 'transfer' ? ' · Em breve' : disabled ? ' · Sem permissão' : ''}</button>;
          })}
        </div>
        <label style={{ fontSize: 12, fontWeight: 650 }}>Insumo<select value={String(form.itemId)} onChange={e => setForm(current => ({ ...current, itemId: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }}><option value="">Selecione...</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label style={{ fontSize: 12, fontWeight: 650 }}>Unidade<select value={String(form.unitId)} onChange={e => setForm(current => ({ ...current, unitId: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }}><option value="">Estoque geral</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
        <div style={{ display: 'grid', gridTemplateColumns: selectedType === 'exit' || selectedType === 'loss' ? '1fr' : '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 650 }}>Quantidade ({selectedItem?.unitOfMeasure ?? 'un'})<input type="number" step=".0001" value={String(form.quantity)} onChange={e => setForm(current => ({ ...current, quantity: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
          {selectedType !== 'exit' && selectedType !== 'loss' && <label style={{ fontSize: 12, fontWeight: 650 }}>Custo unitário<input type="number" step=".0001" value={String(form.unitCost)} onChange={e => setForm(current => ({ ...current, unitCost: e.target.value }))} placeholder={String(selectedItem?.averageCost ?? 0)} style={{ ...inputStyle, marginTop: 5 }} /></label>}
        </div>
        <label style={{ fontSize: 12, fontWeight: 650 }}>Referência<input value={String(form.reference)} onChange={e => setForm(current => ({ ...current, reference: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
        <label style={{ fontSize: 12, fontWeight: 650 }}>Observações {['adjustment', 'loss'].includes(selectedType) && '*'}<textarea value={String(form.notes)} onChange={e => setForm(current => ({ ...current, notes: e.target.value }))} style={{ ...inputStyle, marginTop: 5, minHeight: 80 }} /></label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><SecondaryButton onClick={() => setOpen(false)}>Cancelar</SecondaryButton><PrimaryButton onClick={() => void save()}><CheckCircle size={14} /> Registrar</PrimaryButton></div>
      </div>
    </Modal>
  </div>;
}

export function InventorySettings() {
  const entities = [
    ['inventory_items', 'Insumos'], ['stock_locations', 'Locais'], ['stock_movements', 'Movimentos'], ['inventory_suppliers', 'Fornecedores'], ['inventory_categories', 'Categorias'],
  ] as const;
  const [activeEntity, setActiveEntity] = useState<InventoryMetadata['entity_key']>('inventory_items');
  const [metadata, setMetadata] = useState<InventoryMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void inventoryService.getMetadata(activeEntity).then(value => setMetadata(normalizedMetadata(value)))
      .catch(() => toast.error('Não foi possível carregar as configurações.')).finally(() => setLoading(false));
  }, [activeEntity]);

  const patchField = (key: string, patch: Partial<DynamicFieldSchema>) => setMetadata(current => current ? ({
    ...current, fields: current.fields.map(field => String(field.key) === key ? { ...field, ...patch } : field),
  }) : current);
  const save = async () => {
    if (!metadata) return;
    try { setMetadata(normalizedMetadata(await inventoryService.updateMetadata(activeEntity, metadata))); toast.success('Configurações salvas.'); }
    catch { toast.error('Não foi possível salvar as configurações.'); }
  };

  return <div style={pageStyle}>
    <PageHeader title="Configurações do Estoque" description="Labels, campos e colunas controlados pelo Metadata Engine." back="/inventory" icon={<Settings size={21} />} actions={<PrimaryButton onClick={() => void save()} disabled={!metadata}><Save size={14} /> Salvar</PrimaryButton>} />
    <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', gap: 16 }}>
      <div style={{ ...cardStyle, padding: 10, alignSelf: 'start' }}>{entities.map(([key, label]) => <button key={key} onClick={() => setActiveEntity(key)} style={{ display: 'block', width: '100%', border: 0, borderRadius: 9, padding: '10px 12px', textAlign: 'left', background: activeEntity === key ? '#EEF2FF' : 'transparent', color: activeEntity === key ? '#4F46E5' : '#64748B', fontWeight: 700, cursor: 'pointer' }}>{label}</button>)}</div>
      {loading ? <ModuleStateView state="loading" /> : metadata && <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Labels</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 650 }}>Singular<input value={metadata.singular_label} onChange={e => setMetadata(current => current ? ({ ...current, singular_label: e.target.value }) : current)} style={{ ...inputStyle, marginTop: 5 }} /></label>
            <label style={{ fontSize: 12, fontWeight: 650 }}>Plural<input value={metadata.plural_label} onChange={e => setMetadata(current => current ? ({ ...current, plural_label: e.target.value }) : current)} style={{ ...inputStyle, marginTop: 5 }} /></label>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Campos do formulário</h2>
          {[...metadata.fields].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)).map(field => <div key={String(field.key)} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 80px', gap: 10, alignItems: 'center', padding: '9px 0', borderTop: '1px solid #F1F5F9' }}>
            <input value={field.label} onChange={e => patchField(String(field.key), { label: e.target.value })} style={inputStyle} />
            <label style={{ fontSize: 11 }}><input type="checkbox" checked={field.visible !== false} onChange={e => patchField(String(field.key), { visible: e.target.checked })} /> Visível</label>
            <label style={{ fontSize: 11 }}><input type="checkbox" checked={Boolean(field.required)} onChange={e => patchField(String(field.key), { required: e.target.checked })} /> Obrigatório</label>
            <input type="number" value={Number(field.order ?? 0)} onChange={e => patchField(String(field.key), { order: Number(e.target.value) })} style={inputStyle} />
          </div>)}
        </div>
        <div style={{ ...cardStyle, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14 }}>Colunas da tabela</h2>
          {metadata.table_columns.map(column => <label key={column.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid #F1F5F9', fontSize: 12 }}><span>{column.label}</span><input type="checkbox" checked={column.visible !== false} onChange={e => setMetadata(current => current ? ({ ...current, table_columns: current.table_columns.map(item => item.key === column.key ? { ...item, visible: e.target.checked } : item) }) : current)} /></label>)}
        </div>
      </div>}
    </div>
  </div>;
}

