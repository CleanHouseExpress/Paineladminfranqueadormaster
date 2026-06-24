import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowRightLeft, ClipboardCheck, Save, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService } from '../../../services/inventoryService';
import { unitManagementService } from '../../../services/unitManagementService';
import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import type { InventoryCount, InventorySettings, InventoryTransfer } from '../../../types/inventory';
import type { UnitOption } from '../../../types/unitManagement';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 };
const input: React.CSSProperties = { padding: '9px 11px', border: '1px solid #CBD5E1', borderRadius: 8, background: '#fff' };
const button: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700 };

function Shell({ title, description, settings, children }: { title: string; description: string; settings?: InventorySettings | null; children: ReactNode }) {
  const links = [['/inventory', 'Visão Geral'], ['/inventory/items', 'Itens'], ['/inventory/movements', 'Movimentações']];
  if (settings?.enable_transfers) links.push(['/inventory/transfers', 'Transferências']);
  if (settings?.enable_inventory_counts) links.push(['/inventory/counts', 'Inventário físico']);
  links.push(['/inventory/settings', 'Configurações']);
  return <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}><div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}><header><h1 style={{ margin: 0 }}>{title}</h1><p style={{ color: '#64748B', fontSize: 13 }}>{description}</p><nav style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{links.map(([path, label]) => <Link key={path} to={path} style={{ ...button, textDecoration: 'none', color: '#475569' }}>{label}</Link>)}</nav></header>{children}</div></div>;
}

const flagLabels: Record<keyof Omit<InventorySettings, 'settings_json'>, string> = {
  enable_transfers: 'Transferências entre unidades', enable_inventory_counts: 'Inventário físico', enable_stock_minimum: 'Estoque mínimo', enable_stock_ideal: 'Estoque ideal', enable_reorder_point: 'Ponto de reposição', enable_coverage: 'Cobertura em dias', enable_inventory_alerts: 'Alertas de estoque', enable_purchase_flow: 'Fluxo de compras', enable_recipes: 'Receitas', enable_supplier_management: 'Fornecedores', enable_cost_tracking: 'Acompanhamento de custos', enable_multi_unit_inventory: 'Estoque por unidade',
};

export function InventorySettingsPage() {
  const { hasPermission } = usePermission();
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  useEffect(() => { void inventoryService.getSettings().then(setSettings); }, []);
  if (!settings) return <ModuleStateView state="loading" />;
  const save = async () => { setSettings(await inventoryService.updateSettings(settings)); toast.success('Configurações aplicadas imediatamente.'); };
  return <Shell title="Configurações de Estoque" description="Ative somente os recursos usados pela operação desta rede." settings={settings}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>{Object.entries(flagLabels).map(([flag, label]) => <label key={flag} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}><span><strong>{label}</strong><small style={{ display: 'block', color: '#64748B', marginTop: 4 }}>Configuração por tenant</small></span><input type="checkbox" checked={Boolean(settings[flag as keyof InventorySettings])} onChange={event => setSettings(current => current ? { ...current, [flag]: event.target.checked } : current)} /></label>)}</div>{hasPermission('tenant.inventory.settings.update') && <button onClick={() => void save()} style={{ ...button, background: '#6366F1', color: '#fff', border: 0, width: 'fit-content' }}><Save size={15} />Salvar configurações</button>}</Shell>;
}

export function InventoryTransfersPage() {
  const navigate = useNavigate(); const { hasPermission } = usePermission();
  const [settings, setSettings] = useState<InventorySettings | null>(null); const [rows, setRows] = useState<InventoryTransfer[]>([]); const [units, setUnits] = useState<UnitOption[]>([]); const [items, setItems] = useState<Array<{ value: number; label: string }>>([]);
  const [form, setForm] = useState({ origin: '', destination: '', item: '', quantity: 1 });
  const columns = useMemo<ColumnDef[]>(() => [{ key: 'id', label: '#' }, { key: 'origin_unit_name', label: 'Origem' }, { key: 'destination_unit_name', label: 'Destino' }, { key: 'status', label: 'Status' }, { key: 'requested_at', label: 'Solicitada em', type: 'date' }], []);
  const load = async () => { const next = await inventoryService.getSettings(); setSettings(next); if (next.enable_transfers) setRows(await inventoryService.listTransfers()); };
  useEffect(() => { void load(); void unitManagementService.getUnitOptions().then(setUnits); void inventoryService.itemOptions().then(setItems); }, []);
  if (!settings) return <ModuleStateView state="loading" />; if (!settings.enable_transfers) return <ModuleStateView state="empty" emptyHint="Transferências estão desabilitadas para esta rede." />;
  const create = async () => { await inventoryService.createTransfer({ origin_unit_id: Number(form.origin), destination_unit_id: Number(form.destination), items: [{ inventory_item_id: Number(form.item), quantity: form.quantity }] }); toast.success('Transferência solicitada.'); await load(); };
  return <Shell title="Transferências" description="Reserva, trânsito e recebimento entre unidades." settings={settings}><div style={{ ...card, display: 'flex', gap: 8, flexWrap: 'wrap' }}><select style={input} value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })}><option value="">Origem</option>{units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select><select style={input} value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}><option value="">Destino</option>{units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select><select style={input} value={form.item} onChange={e => setForm({ ...form, item: e.target.value })}><option value="">Item</option>{items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}</select><input style={{ ...input, width: 90 }} type="number" min={0.0001} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />{hasPermission('tenant.inventory.transfer') && <button style={{ ...button, background: '#6366F1', color: '#fff', border: 0 }} onClick={() => void create()}><ArrowRightLeft size={14} />Solicitar</button>}</div><DynamicTableRenderer columns={columns} data={rows as unknown as Record<string, unknown>[]} keyField="id" onRowClick={row => navigate(`/inventory/transfers/${row.id}`)} /></Shell>;
}

export function InventoryTransferDetailPage() {
  const { id } = useParams(); const { hasPermission } = usePermission(); const [transfer, setTransfer] = useState<InventoryTransfer | null>(null); const [settings, setSettings] = useState<InventorySettings | null>(null);
  const load = async () => { if (id) setTransfer(await inventoryService.getTransfer(id)); setSettings(await inventoryService.getSettings()); }; useEffect(() => { void load(); }, [id]);
  if (!transfer || !settings) return <ModuleStateView state="loading" />;
  const action = async (name: 'approve' | 'ship' | 'receive' | 'cancel') => { setTransfer(await inventoryService.transferAction(transfer.id, name)); toast.success('Transferência atualizada.'); };
  return <Shell title={`Transferência #${transfer.id}`} description={`${transfer.origin_unit_name} → ${transfer.destination_unit_name}`} settings={settings}><div style={card}><strong>Status: {transfer.status}</strong><div style={{ display: 'flex', gap: 8, marginTop: 14 }}>{transfer.status === 'requested' && hasPermission('tenant.inventory.transfer.approve') && <button style={button} onClick={() => void action('approve')}>Aprovar</button>}{transfer.status === 'approved' && hasPermission('tenant.inventory.transfer.approve') && <button style={button} onClick={() => void action('ship')}>Enviar</button>}{transfer.status === 'in_transit' && hasPermission('tenant.inventory.transfer.receive') && <button style={button} onClick={() => void action('receive')}>Receber</button>}{['requested', 'approved'].includes(transfer.status) && <button style={button} onClick={() => void action('cancel')}>Cancelar</button>}</div></div><div style={card}>{transfer.items.map(item => <div key={item.id}>{item.item_name}: {item.quantity}</div>)}</div></Shell>;
}

export function InventoryCountsPage() {
  const navigate = useNavigate(); const [settings, setSettings] = useState<InventorySettings | null>(null); const [rows, setRows] = useState<InventoryCount[]>([]); const [units, setUnits] = useState<UnitOption[]>([]); const [unit, setUnit] = useState('');
  const load = async () => { const next = await inventoryService.getSettings(); setSettings(next); if (next.enable_inventory_counts) setRows(await inventoryService.listCounts()); }; useEffect(() => { void load(); void unitManagementService.getUnitOptions().then(setUnits); }, []);
  if (!settings) return <ModuleStateView state="loading" />; if (!settings.enable_inventory_counts) return <ModuleStateView state="empty" emptyHint="Inventário físico está desabilitado." />;
  const create = async () => { const count = await inventoryService.createCount({ unit_id: Number(unit), type: 'full' }); navigate(`/inventory/counts/${count.id}`); };
  const columns: ColumnDef[] = [{ key: 'id', label: '#' }, { key: 'unit_name', label: 'Unidade' }, { key: 'type', label: 'Tipo' }, { key: 'status', label: 'Status' }];
  return <Shell title="Inventário Físico" description="Contagens parciais, completas e cíclicas." settings={settings}><div style={{ ...card, display: 'flex', gap: 8 }}><select style={input} value={unit} onChange={e => setUnit(e.target.value)}><option value="">Unidade</option>{units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select><button style={{ ...button, background: '#6366F1', color: '#fff', border: 0 }} onClick={() => void create()}><ClipboardCheck size={14} />Iniciar contagem</button></div><DynamicTableRenderer columns={columns} data={rows as unknown as Record<string, unknown>[]} keyField="id" onRowClick={row => navigate(`/inventory/counts/${row.id}`)} /></Shell>;
}

export function InventoryCountDetailPage() {
  const { id } = useParams(); const { hasPermission } = usePermission(); const [count, setCount] = useState<InventoryCount | null>(null); const [settings, setSettings] = useState<InventorySettings | null>(null);
  const load = async () => { if (id) setCount(await inventoryService.getCount(id)); setSettings(await inventoryService.getSettings()); }; useEffect(() => { void load(); }, [id]); if (!count || !settings) return <ModuleStateView state="loading" />;
  const save = async () => setCount(await inventoryService.updateCount(count.id, { items: count.items.map(item => ({ inventory_item_id: item.inventory_item_id, counted_quantity: item.counted_quantity ?? item.system_quantity })) }));
  const action = async (name: 'complete' | 'approve') => setCount(await inventoryService.countAction(count.id, name));
  return <Shell title={`Contagem #${count.id}`} description={`${count.unit_name} · ${count.status}`} settings={settings}><div style={card}>{count.items.map((item, index) => <label key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 8, marginBottom: 8 }}><span>{item.item_name}</span><span>Sistema: {item.system_quantity}</span><input style={input} type="number" value={item.counted_quantity ?? ''} disabled={count.status !== 'counting'} onChange={e => setCount(current => current ? { ...current, items: current.items.map((row, rowIndex) => rowIndex === index ? { ...row, counted_quantity: Number(e.target.value) } : row) } : current)} /></label>)}</div><div style={{ display: 'flex', gap: 8 }}>{count.status === 'counting' && <><button style={button} onClick={() => void save()}>Salvar</button><button style={button} onClick={() => void save().then(() => action('complete'))}>Concluir</button></>}{count.status === 'completed' && hasPermission('tenant.inventory.count.approve') && <button style={button} onClick={() => void action('approve')}>Aprovar e ajustar</button>}</div></Shell>;
}
