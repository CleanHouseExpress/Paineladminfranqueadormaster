import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, CheckCircle2, Plus, RotateCcw, Save, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService } from '../../../services/inventoryService';
import { getApiErrorMessage } from '../../../services/apiClient';
import { unitManagementService } from '../../../services/unitManagementService';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import type { InventoryCount, InventoryItem, InventorySettings, InventoryTransfer, StockLocation } from '../../../types/inventory';
import type { UnitOption } from '../../../types/unitManagement';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 };
const button: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700 };
const input: React.CSSProperties = { width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 10px', fontSize: 13 };
const tableWrap: React.CSSProperties = { overflowX: 'auto', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8 };
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 13, verticalAlign: 'middle' };

function Shell({ title, description, settings, children }: { title: string; description: string; settings?: InventorySettings | null; children: ReactNode }) {
  const [resolvedSettings, setResolvedSettings] = useState<InventorySettings | null>(settings ?? null);

  useEffect(() => {
    if (settings) {
      setResolvedSettings(settings);
      return;
    }
    void inventoryService.getSettings().then(setResolvedSettings).catch(() => setResolvedSettings(null));
  }, [settings]);

  const links = [
    ['/inventory', 'Visao Geral'],
    ['/inventory/items', 'Itens'],
    ['/inventory/movements', 'Movimentacoes'],
    ...(resolvedSettings?.enable_transfers ? [['/inventory/transfers', 'Transferencias']] : []),
    ['/inventory/settings', 'Configuracoes'],
  ];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
        <header>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <p style={{ color: '#64748B', fontSize: 13 }}>{description}</p>
          <nav style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {links.map(([path, label]) => <Link key={path} to={path} style={{ ...button, textDecoration: 'none', color: '#475569' }}>{label}</Link>)}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  return ({ draft: 'Rascunho', requested: 'Solicitada', approved: 'Aprovada', in_transit: 'Em trânsito', received: 'Recebida', confirmed: 'Confirmada', canceled: 'Cancelada', reversed: 'Estornada' } as Record<string, string>)[status] ?? status;
}

function diffLabel(value: number | null | undefined) {
  const diff = Number(value ?? 0);
  if (diff > 0) return `Sobra +${diff}`;
  if (diff < 0) return `Falta ${diff}`;
  return 'Sem divergencia';
}

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

function errorMessage(error: unknown) {
  return getApiErrorMessage(error, 'Nao foi possivel concluir a operacao.');
}

const flagLabels: Record<string, string> = {
  enable_transfers: 'Transferencias internas',
  enable_stock_minimum: 'Estoque minimo',
  enable_stock_ideal: 'Estoque ideal',
  enable_reorder_point: 'Ponto de reposicao',
  enable_coverage: 'Cobertura em dias',
  enable_inventory_alerts: 'Alertas de estoque',
  enable_purchase_flow: 'Fluxo de compras',
  enable_recipes: 'Receitas',
  enable_supplier_management: 'Fornecedores',
  enable_cost_tracking: 'Acompanhamento de custos',
  enable_multi_unit_inventory: 'Estoque por unidade',
};

export function InventorySettingsPage() {
  const { hasPermission } = usePermission();
  const [settings, setSettings] = useState<InventorySettings | null>(null);

  useEffect(() => { void inventoryService.getSettings().then(setSettings); }, []);

  if (!settings) return <ModuleStateView state="loading" />;

  const save = async () => {
    setSettings(await inventoryService.updateSettings({
      ...settings,
      enable_inventory_counts: false,
    }));
    toast.success('Configuracoes aplicadas imediatamente.');
  };

  return (
    <Shell title="Configuracoes de Estoque" description="Ative somente os recursos usados pela operacao desta rede." settings={settings}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
        {Object.entries(flagLabels).map(([flag, label]) => (
          <label key={flag} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>
              <strong>{label}</strong>
              <small style={{ display: 'block', color: '#64748B', marginTop: 4 }}>Configuracao por tenant</small>
            </span>
            <input type="checkbox" checked={Boolean(settings[flag as keyof InventorySettings])} onChange={event => setSettings(current => current ? { ...current, [flag]: event.target.checked } : current)} />
          </label>
        ))}
      </div>
      {hasPermission('tenant.inventory.settings.update') && <button onClick={() => void save()} style={{ ...button, background: '#6366F1', color: '#fff', border: 0, width: 'fit-content' }}><Save size={15} />Salvar configuracoes</button>}
    </Shell>
  );
}

export function InventoryTransfersPage() {
  const { hasPermission } = usePermission();
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [form, setForm] = useState({ originUnitId: '', destinationUnitId: '', itemId: '', quantity: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentSettings = await inventoryService.getSettings();
      setSettings(currentSettings);
      if (!currentSettings.enable_transfers) {
        setTransfers([]);
        return;
      }
      setTransfers(await inventoryService.listTransfers());
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const openForm = async () => {
    setFormOpen(true);
    if (units.length || items.length) return;
    setFormLoading(true);
    try {
      const [unitOptions, itemRows] = await Promise.all([
        unitManagementService.getUnitOptions(),
        inventoryService.listItems({ active: true }),
      ]);
      setUnits(unitOptions);
      setItems(itemRows);
    } catch (loadError) {
      toast.error(errorMessage(loadError));
    } finally {
      setFormLoading(false);
    }
  };

  const createTransfer = async () => {
    const quantity = Number(form.quantity);
    if (!form.originUnitId || !form.destinationUnitId || !form.itemId || quantity <= 0) {
      toast.error('Preencha origem, destino, item e quantidade.');
      return;
    }
    if (form.originUnitId === form.destinationUnitId) {
      toast.error('Origem e destino devem ser unidades diferentes.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.createTransfer({
        origin_unit_id: Number(form.originUnitId),
        destination_unit_id: Number(form.destinationUnitId),
        items: [{ inventory_item_id: Number(form.itemId), quantity }],
      });
      toast.success('Transferencia solicitada.');
      setFormOpen(false);
      setForm({ originUnitId: '', destinationUnitId: '', itemId: '', quantity: '' });
      await load();
    } catch (createError) {
      toast.error(errorMessage(createError));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { void load(); }, []);
  if (loading) return <ModuleStateView state="loading" />;
  if (error) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;
  if (settings && !settings.enable_transfers) {
    return (
      <Shell title="Transferências" description="Abastecimento interno entre unidades com rastreabilidade pelo ledger de estoque." settings={settings}>
        <ModuleStateView state="empty" emptyHint="Transferencias internas estão desativadas para esta rede." />
      </Shell>
    );
  }

  return (
    <Shell title="Transferências" description="Abastecimento interno entre unidades com rastreabilidade pelo ledger de estoque." settings={settings}>
      {hasPermission('tenant.inventory.transfer') && <button type="button" style={{ ...button, width: 'fit-content', background: '#0F172A', color: '#fff', border: 0 }} onClick={() => void openForm()}><Plus size={15} />Nova transferência</button>}
      {formOpen && (
        <div style={{ ...card, display: 'grid', gap: 12 }}>
          <strong>Solicitar transferência interna</strong>
          {formLoading ? <ModuleStateView state="loading" /> : <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <label>Unidade de origem<select style={input} value={form.originUnitId} onChange={event => setForm(current => ({ ...current, originUnitId: event.target.value }))}><option value="">Selecione</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
              <label>Unidade de destino<select style={input} value={form.destinationUnitId} onChange={event => setForm(current => ({ ...current, destinationUnitId: event.target.value }))}><option value="">Selecione</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
              <label>Item<select style={input} value={form.itemId} onChange={event => setForm(current => ({ ...current, itemId: event.target.value }))}><option value="">Selecione</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Quantidade<input style={input} type="number" min="0.01" step="any" value={form.quantity} onChange={event => setForm(current => ({ ...current, quantity: event.target.value }))} /></label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={button} onClick={() => setFormOpen(false)}>Cancelar</button>
              <button type="button" disabled={submitting} style={{ ...button, background: '#2563EB', color: '#fff', border: 0 }} onClick={() => void createTransfer()}>{submitting ? 'Solicitando...' : 'Solicitar transferência'}</button>
            </div>
          </>}
        </div>
      )}
      {transfers.length === 0 ? <ModuleStateView state="empty" emptyHint="Nenhuma transferência interna encontrada." /> : (
        <div style={tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Transferência</th><th style={th}>Origem</th><th style={th}>Destino</th><th style={th}>Status</th><th style={th}>Solicitada em</th><th style={th}>Itens</th></tr></thead>
            <tbody>{transfers.map(transfer => (
              <tr key={transfer.id}>
                <td style={td}><Link to={`/inventory/transfers/${transfer.id}`} style={{ color: '#2563EB', fontWeight: 700 }}>{transfer.number ?? `#${transfer.id}`}</Link></td>
                <td style={td}>{transfer.origin_unit_name}</td>
                <td style={td}>{transfer.destination_unit_name}</td>
                <td style={td}>{statusLabel(transfer.status)}</td>
                <td style={td}>{dateLabel(transfer.requested_at)}</td>
                <td style={td}>{transfer.items.length}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

export function InventoryTransferDetailPage() {
  const { id } = useParams();
  const { hasPermission } = usePermission();
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [transfer, setTransfer] = useState<InventoryTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const actionPendingRef = useRef(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const currentSettings = await inventoryService.getSettings();
      setSettings(currentSettings);
      if (!currentSettings.enable_transfers) {
        setTransfer(null);
        return;
      }
      setTransfer(await inventoryService.getTransfer(id));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [id]);

  const runAction = async (action: 'approve' | 'ship' | 'receive' | 'cancel') => {
    if (!id || actionPendingRef.current) return;
    actionPendingRef.current = true;
    setActionPending(true);
    try {
      setTransfer(await inventoryService.transferAction(id, action));
      toast.success('Transferencia atualizada.');
    } catch (actionError) {
      toast.error(errorMessage(actionError));
    } finally {
      actionPendingRef.current = false;
      setActionPending(false);
    }
  };

  if (loading) return <ModuleStateView state="loading" />;
  if (error) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;
  if (settings && !settings.enable_transfers) {
    return (
      <Shell title="Transferências" description="Abastecimento interno entre unidades com rastreabilidade pelo ledger de estoque." settings={settings}>
        <ModuleStateView state="empty" emptyHint="Transferencias internas estão desativadas para esta rede." />
      </Shell>
    );
  }
  if (!transfer) return <ModuleStateView state="error" errorMessage="Transferencia nao encontrada." onRetry={() => void load()} />;

  const canViewCost = hasPermission('tenant.inventory.cost.view');

  return (
    <Shell title={`Transferência ${transfer.number ?? `#${transfer.id}`}`} description={`${transfer.origin_unit_name} → ${transfer.destination_unit_name}`} settings={settings}>
      <Link to="/inventory/transfers" style={{ ...button, width: 'fit-content', textDecoration: 'none', color: '#475569' }}><ArrowLeft size={15} />Voltar</Link>
      <div style={{ ...card, display: 'grid', gap: 8 }}>
        <strong>Status: {statusLabel(transfer.status)}</strong>
        <span>Solicitada em {dateLabel(transfer.requested_at)}</span>
        {transfer.notes && <span>{transfer.notes}</span>}
      </div>
      <div style={tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Item</th><th style={th}>Quantidade</th>{canViewCost && <th style={th}>Custo unitário</th>}</tr></thead>
          <tbody>{transfer.items.map(item => <tr key={item.id}><td style={td}>{item.item_name}</td><td style={td}>{item.quantity}</td>{canViewCost && <td style={td}>{item.unit_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>}</tr>)}</tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {transfer.status === 'requested' && hasPermission('tenant.inventory.transfer.approve') && <button disabled={actionPending} style={button} onClick={() => void runAction('approve')}><CheckCircle2 size={15} />Aprovar</button>}
        {transfer.status === 'approved' && hasPermission('tenant.inventory.transfer.approve') && <button disabled={actionPending} style={button} onClick={() => void runAction('ship')}><Truck size={15} />Enviar</button>}
        {transfer.status === 'in_transit' && hasPermission('tenant.inventory.transfer.receive') && <button disabled={actionPending} style={button} onClick={() => void runAction('receive')}><CheckCircle2 size={15} />Receber</button>}
        {['requested', 'approved'].includes(transfer.status) && hasPermission('tenant.inventory.transfer') && <button disabled={actionPending} style={button} onClick={() => void runAction('cancel')}><XCircle size={15} />Cancelar</button>}
      </div>
    </Shell>
  );
}

export function InventoryCountsPage() {
  const { hasPermission } = usePermission();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try { setCounts(await inventoryService.listCounts()); }
    catch { setError('Nao foi possivel carregar os inventarios fisicos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <ModuleStateView state="loading" />;
  if (error) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  return (
    <Shell title="Inventario Fisico" description="Contagem fisica simples com snapshot de saldo e ajustes oficiais no ledger.">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, flex: 1 }}>
          <div style={card}><strong>{counts.length}</strong><small style={{ display: 'block', color: '#64748B' }}>Contagens</small></div>
          <div style={card}><strong>{counts.filter(row => row.status === 'draft').length}</strong><small style={{ display: 'block', color: '#64748B' }}>Rascunhos</small></div>
          <div style={card}><strong>{counts.reduce((sum, row) => sum + Number(row.divergent_items_count ?? 0), 0)}</strong><small style={{ display: 'block', color: '#64748B' }}>Divergencias</small></div>
        </div>
        {hasPermission('tenant.inventory.stock_counts.create') && <Link to="/inventory/counts/new" style={{ ...button, textDecoration: 'none', color: '#fff', background: '#0F172A', border: 0 }}><Plus size={15} />Nova contagem</Link>}
      </div>
      {counts.length === 0 ? <ModuleStateView state="empty" emptyHint="Nenhum inventario fisico aberto ainda." /> : (
        <div style={tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Numero</th><th style={th}>Unidade</th><th style={th}>Local</th><th style={th}>Status</th><th style={th}>Data</th><th style={th}>Responsavel</th><th style={th}>Itens</th><th style={th}>Divergencias</th></tr></thead>
            <tbody>
              {counts.map(count => (
                <tr key={count.id}>
                  <td style={td}><Link to={`/inventory/counts/${count.id}`} style={{ color: '#2563EB', fontWeight: 700 }}>{count.number}</Link></td>
                  <td style={td}>{count.unit_name ?? count.unit?.name ?? '-'}</td>
                  <td style={td}>{count.stock_location_name ?? count.stock_location?.name ?? '-'}</td>
                  <td style={td}>{statusLabel(count.status)}</td>
                  <td style={td}>{dateLabel(count.counted_at)}</td>
                  <td style={td}>{count.created_by_name ?? '-'}</td>
                  <td style={td}>{count.items_count ?? count.items.length}</td>
                  <td style={td}>{count.divergent_items_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

export function InventoryCountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState<InventoryCount | null>(null);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [form, setForm] = useState({ unitId: '', locationId: '', mode: 'full', itemIds: [] as string[], notes: '' });

  const selectedLocations = useMemo(() => locations.filter(location => !form.unitId || location.unitId === form.unitId), [locations, form.unitId]);
  const draftItems = count?.items ?? [];
  const totalDiff = draftItems.reduce((sum, item) => sum + Math.abs(Number(item.difference_quantity ?? 0)), 0);

  const load = async () => {
    setLoading(true);
    try {
      const [unitOptions, locationRows, itemRows, existing] = await Promise.all([
        unitManagementService.getUnitOptions().catch(() => [] as UnitOption[]),
        inventoryService.listLocations({ active: true }).catch(() => []),
        inventoryService.listItems({ active: true }).catch(() => []),
        isNew ? Promise.resolve(null) : inventoryService.getCount(String(id)),
      ]);
      setUnits(unitOptions);
      setLocations(locationRows);
      setItems(itemRows);
      setCount(existing);
    } catch {
      toast.error('Nao foi possivel carregar a contagem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [id]);

  const create = async () => {
    if (!form.unitId || !form.locationId) { toast.error('Selecione unidade e local.'); return; }
    try {
      const created = await inventoryService.createCount({
        unit_id: Number(form.unitId),
        stock_location_id: Number(form.locationId),
        mode: form.mode,
        item_ids: form.mode === 'selected' ? form.itemIds.map(Number) : undefined,
        notes: form.notes || null,
      });
      toast.success('Contagem aberta.');
      navigate(`/inventory/counts/${created.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const setItemValue = (itemId: number, key: 'counted_quantity' | 'reason', value: string) => {
    setCount(current => current ? {
      ...current,
      items: current.items.map(item => item.inventory_item_id === itemId ? {
        ...item,
        [key]: key === 'counted_quantity' ? (value === '' ? null : Number(value)) : value,
        difference_quantity: key === 'counted_quantity' ? (value === '' ? null : Number(value) - Number(item.system_quantity ?? 0)) : item.difference_quantity,
      } : item),
    } : current);
  };

  const save = async () => {
    if (!count) return;
    try {
      const updated = await inventoryService.updateCount(count.id, {
        notes: count.notes,
        items: count.items.map(item => ({ inventory_item_id: item.inventory_item_id, counted_quantity: item.counted_quantity, reason: item.reason || null })),
      });
      setCount(updated);
      toast.success('Contagem salva.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const action = async (next: 'confirm' | 'cancel' | 'reverse') => {
    if (!count) return;
    const reason = next === 'cancel' || next === 'reverse' ? window.prompt(next === 'reverse' ? 'Motivo do estorno' : 'Motivo do cancelamento') : null;
    if ((next === 'cancel' || next === 'reverse') && !reason) return;
    try {
      const updated = await inventoryService.countAction(count.id, next, {
        reason,
        items: next === 'confirm' ? count.items.map(item => ({ inventory_item_id: item.inventory_item_id, counted_quantity: item.counted_quantity, reason: item.reason || null })) : undefined,
      });
      setCount(updated);
      toast.success(next === 'confirm' ? 'Contagem confirmada.' : next === 'cancel' ? 'Contagem cancelada.' : 'Contagem estornada.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (loading) return <ModuleStateView state="loading" />;

  if (isNew) return (
    <Shell title="Nova contagem" description="Abra um inventario fisico simples a partir do saldo atual do local.">
      <Link to="/inventory/counts" style={{ ...button, width: 'fit-content', textDecoration: 'none', color: '#475569' }}><ArrowLeft size={15} />Voltar</Link>
      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <label>Unidade<select style={input} value={form.unitId} onChange={event => setForm(current => ({ ...current, unitId: event.target.value, locationId: '' }))}><option value="">Selecione</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
        <label>Local<select style={input} value={form.locationId} onChange={event => setForm(current => ({ ...current, locationId: event.target.value }))}><option value="">Selecione</option>{selectedLocations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label>Tipo<select style={input} value={form.mode} onChange={event => setForm(current => ({ ...current, mode: event.target.value }))}><option value="full">Completa</option><option value="selected">Selecionada</option></select></label>
        <label>Observacoes<input style={input} value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} /></label>
        {form.mode === 'selected' && <label style={{ gridColumn: '1 / -1' }}>Itens<select multiple style={{ ...input, minHeight: 130 }} value={form.itemIds} onChange={event => setForm(current => ({ ...current, itemIds: Array.from(event.target.selectedOptions).map(option => option.value) }))}>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        <button disabled={!hasPermission('tenant.inventory.stock_counts.create')} onClick={() => void create()} style={{ ...button, background: '#0F172A', color: '#fff', border: 0, width: 'fit-content' }}><Plus size={15} />Abrir contagem</button>
      </div>
    </Shell>
  );

  if (!count) return <ModuleStateView state="empty" emptyHint="Contagem nao encontrada." />;
  const isDraft = count.status === 'draft';

  return (
    <Shell title={count.number} description="Confira o snapshot, informe a quantidade fisica e confirme apenas quando todos os itens estiverem contados.">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to="/inventory/counts" style={{ ...button, textDecoration: 'none', color: '#475569' }}><ArrowLeft size={15} />Voltar</Link>
        {isDraft && hasPermission('tenant.inventory.stock_counts.update') && <button onClick={() => void save()} style={button}><Save size={15} />Salvar</button>}
        {isDraft && hasPermission('tenant.inventory.stock_counts.confirm') && <button onClick={() => void action('confirm')} style={{ ...button, background: '#16A34A', color: '#fff', border: 0 }}><CheckCircle2 size={15} />Confirmar</button>}
        {isDraft && hasPermission('tenant.inventory.stock_counts.cancel') && <button onClick={() => void action('cancel')} style={button}><XCircle size={15} />Cancelar</button>}
        {count.status === 'confirmed' && hasPermission('tenant.inventory.stock_counts.reverse') && <button onClick={() => void action('reverse')} style={button}><RotateCcw size={15} />Estornar</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        <div style={card}><strong>{statusLabel(count.status)}</strong><small style={{ display: 'block', color: '#64748B' }}>Status</small></div>
        <div style={card}><strong>{count.unit_name ?? count.unit?.name}</strong><small style={{ display: 'block', color: '#64748B' }}>Unidade</small></div>
        <div style={card}><strong>{count.stock_location_name ?? count.stock_location?.name}</strong><small style={{ display: 'block', color: '#64748B' }}>Local</small></div>
        <div style={card}><strong>{totalDiff}</strong><small style={{ display: 'block', color: '#64748B' }}>Divergencia absoluta</small></div>
      </div>
      {count.movements && count.movements.length > 0 && <div style={card}><strong>Movimentos gerados</strong><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{count.movements.map(movement => <span key={movement.id} style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 9px' }}>{movement.number} - {movement.movement_type}</span>)}</div></div>}
      <div style={tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Item</th><th style={th}>UOM</th><th style={th}>Sistema</th><th style={th}>Contado</th><th style={th}>Diferenca</th><th style={th}>Motivo</th><th style={th}>Movimento</th></tr></thead>
          <tbody>
            {count.items.map(item => (
              <tr key={item.id}>
                <td style={td}>{item.item_name ?? item.item?.name ?? `Item ${item.inventory_item_id}`}</td>
                <td style={td}>{item.uom_id ?? item.item?.unit_of_measure ?? '-'}</td>
                <td style={td}>{item.system_quantity}</td>
                <td style={td}>{isDraft ? <input type="number" min="0" step="0.0001" style={{ ...input, minWidth: 110 }} value={item.counted_quantity ?? ''} onChange={event => setItemValue(item.inventory_item_id, 'counted_quantity', event.target.value)} /> : item.counted_quantity}</td>
                <td style={td}><strong>{diffLabel(item.difference_quantity)}</strong>{item.cost_unavailable && <small style={{ display: 'block', color: '#B45309' }}>Custo indisponivel</small>}</td>
                <td style={td}>{isDraft ? <input style={{ ...input, minWidth: 160 }} value={item.reason ?? ''} onChange={event => setItemValue(item.inventory_item_id, 'reason', event.target.value)} /> : item.reason ?? '-'}</td>
                <td style={td}>{item.stock_movement_number ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
