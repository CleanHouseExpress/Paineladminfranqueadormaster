import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  BadgePercent, Edit, Eye, Gift, Plus, Save, Settings, Trash2, WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';

import { DynamicTableRenderer, type ColumnDef } from '../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../shared/components/ModuleStateView';
import { usePermission } from '../../shared/hooks/usePermission';
import { loyaltyService } from '../../services/loyaltyService';
import type {
  CashbackMetrics, CashbackRule, CashbackRulePayload, CashbackSettings, CashbackWallet,
} from '../../types/loyalty';
import { LOYALTY_PERMISSIONS } from '../../types/loyalty';

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid rgba(15,23,42,.08)', borderRadius: 14, padding: 18 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 9, background: '#fff', color: '#0F172A', fontSize: 13, boxSizing: 'border-box' };
const money = (value: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0));

function Header({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap', marginBottom: 20 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#F59E0B,#EC4899)', color: '#fff' }}><Gift size={20} /></div>
      <div><h1 style={{ margin: 0, fontSize: 22, color: '#0F172A' }}>{title}</h1><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>{subtitle}</p></div>
    </div>
    {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
  </div>;
}

function Button({ children, onClick, secondary, danger, disabled, testId }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; testId?: string }) {
  const color = danger ? '#DC2626' : '#475569';
  return <button data-testid={testId} type="button" onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, border: secondary || danger ? '1px solid #E2E8F0' : 0, background: disabled ? '#CBD5E1' : secondary || danger ? '#fff' : 'linear-gradient(135deg,#F59E0B,#EC4899)', color: secondary || danger ? color : '#fff', fontWeight: 700, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>;
}

function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { setData(await loader()); } catch { setError('Não foi possível carregar os dados de fidelidade.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, deps);
  return { data, loading, error, load };
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return <div style={cardStyle}><small style={{ color: '#64748B' }}>{label}</small><strong style={{ display: 'block', marginTop: 6, color: '#0F172A', fontSize: 20 }}>{value}</strong>{helper && <span style={{ color: '#94A3B8', fontSize: 11 }}>{helper}</span>}</div>;
}

export function LoyaltyDashboardPage() {
  const navigate = useNavigate();
  const result = useLoad<CashbackMetrics>(loyaltyService.metrics);
  if (result.loading) return <ModuleStateView state="loading" />;
  if (result.error || !result.data) return <ModuleStateView state="error" errorMessage={result.error} onRetry={() => void result.load()} />;
  const metrics = result.data;
  const bars = [
    ['Disponível', metrics.availableTotal, '#059669'],
    ['Pendente', metrics.pendingTotal, '#D97706'],
    ['Resgatado', metrics.redeemedTotal, '#7C3AED'],
    ['Expirado', metrics.expiredTotal, '#64748B'],
  ] as const;
  const max = Math.max(1, ...bars.map(([, value]) => value));
  return <div style={pageStyle} data-testid="loyalty-dashboard">
    <Header title="Fidelidade / Cashback" subtitle="Acompanhe geração, resgate, passivo e carteiras de clientes." actions={<>
      <Button secondary onClick={() => navigate('/loyalty/cashback/rules')}><BadgePercent size={14} /> Regras</Button>
      <Button secondary onClick={() => navigate('/loyalty/cashback/wallets')}><WalletCards size={14} /> Carteiras</Button>
      <Button secondary onClick={() => navigate('/loyalty/cashback/settings')}><Settings size={14} /> Configurações</Button>
    </>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
      <MetricCard label="Cashback gerado" value={money(metrics.generatedTotal)} />
      <MetricCard label="Cashback resgatado" value={money(metrics.redeemedTotal)} />
      <MetricCard label="Passivo potencial" value={money(metrics.liabilityTotal)} helper="Saldo disponível em aberto" />
      <MetricCard label="Clientes com saldo" value={metrics.customersWithBalance} />
      <MetricCard label="Disponível" value={money(metrics.availableTotal)} />
      <MetricCard label="Pendente" value={money(metrics.pendingTotal)} />
      <MetricCard label="Expirado" value={money(metrics.expiredTotal)} />
      <MetricCard label="Taxa de resgate" value={`${metrics.redemptionRate.toFixed(1)}%`} />
    </div>
    <section style={cardStyle}>
      <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>Distribuição do cashback</h2>
      <div style={{ display: 'grid', gap: 12 }}>{bars.map(([label, value, color]) => <div key={label}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12, marginBottom: 5 }}><span>{label}</span><strong>{money(value)}</strong></div>
        <div style={{ height: 10, borderRadius: 99, background: '#F1F5F9' }}><div style={{ width: `${Math.round((value / max) * 100)}%`, height: '100%', borderRadius: 99, background: color }} /></div>
      </div>)}</div>
    </section>
  </div>;
}

const emptyRule = (): CashbackRulePayload => ({
  name: '',
  description: '',
  type: 'percentage',
  calculation_base: 'sale_total',
  value: 5,
  priority: 10,
  stackable: false,
  active: true,
  starts_at: null,
  ends_at: null,
  minimum_purchase_amount: null,
  first_purchase_only: false,
  max_reward_amount: null,
});

function rulePayload(rule: CashbackRule): CashbackRulePayload {
  return {
    name: rule.name,
    description: rule.description ?? '',
    type: rule.type,
    calculation_base: rule.calculationBase,
    value: rule.value,
    priority: rule.priority,
    stackable: rule.stackable,
    active: rule.active,
    starts_at: rule.startsAt ?? null,
    ends_at: rule.endsAt ?? null,
    minimum_purchase_amount: rule.minimumPurchaseAmount ?? null,
    unit_id: rule.unitId ? Number(rule.unitId) : null,
    catalog_item_id: rule.catalogItemId ? Number(rule.catalogItemId) : null,
    catalog_category_id: rule.catalogCategoryId ? Number(rule.catalogCategoryId) : null,
    customer_segment: rule.customerSegment ?? null,
    first_purchase_only: rule.firstPurchaseOnly,
    max_reward_amount: rule.maxRewardAmount ?? null,
  };
}

export function LoyaltyRulesPage() {
  const { hasPermission } = usePermission();
  const result = useLoad<CashbackRule[]>(loyaltyService.rules);
  const [editing, setEditing] = useState<CashbackRule | null>(null);
  const [form, setForm] = useState<CashbackRulePayload>(emptyRule());
  const [saving, setSaving] = useState(false);
  const canCreate = hasPermission(LOYALTY_PERMISSIONS.rulesCreate);
  const canUpdate = hasPermission(LOYALTY_PERMISSIONS.rulesUpdate);
  const canDelete = hasPermission(LOYALTY_PERMISSIONS.rulesDelete);
  const start = (rule?: CashbackRule) => { setEditing(rule ?? null); setForm(rule ? rulePayload(rule) : emptyRule()); };
  const save = async () => {
    if (!form.name || form.value <= 0) { toast.error('Informe nome e valor maior que zero.'); return; }
    setSaving(true);
    try {
      if (editing) await loyaltyService.updateRule(editing.id, form); else await loyaltyService.createRule(form);
      toast.success('Regra salva.'); setEditing(null); setForm(emptyRule()); await result.load();
    } catch { toast.error('Não foi possível salvar a regra.'); } finally { setSaving(false); }
  };
  const remove = async (rule: CashbackRule) => {
    if (!window.confirm('Excluir esta regra de cashback?')) return;
    try { await loyaltyService.deleteRule(rule.id); toast.success('Regra excluída.'); await result.load(); } catch { toast.error('Não foi possível excluir.'); }
  };
  const columns: ColumnDef[] = [
    { key: 'name', label: 'Regra', render: value => <strong>{String(value)}</strong> },
    { key: 'type', label: 'Tipo', width: '120px' },
    { key: 'calculationBase', label: 'Base', width: '150px' },
    { key: 'value', label: 'Valor', width: '110px', render: (value, row) => row.type === 'percentage' ? `${Number(value).toFixed(2)}%` : money(value) },
    { key: 'priority', label: 'Prioridade', type: 'number', width: '95px' },
    { key: 'stackable', label: 'Acumula', width: '90px', render: value => value ? 'Sim' : 'Não' },
    { key: 'active', label: 'Status', width: '90px', render: value => value ? 'Ativa' : 'Inativa' },
  ];
  if (result.loading) return <ModuleStateView state="loading" />;
  if (result.error || !result.data) return <ModuleStateView state="error" errorMessage={result.error} onRetry={() => void result.load()} />;
  return <div style={pageStyle} data-testid="loyalty-rules-page">
    <Header title="Regras de Cashback" subtitle="Configure regras por percentual ou valor fixo, prioridade e acumulação." actions={canCreate && <Button onClick={() => start()} testId="loyalty-rule-new"><Plus size={14} /> Nova regra</Button>} />
    {(canCreate || editing) && <section style={{ ...cardStyle, marginBottom: 16 }} data-testid="loyalty-rule-form">
      <h2 style={{ marginTop: 0, fontSize: 16 }}>{editing ? 'Editar regra' : 'Nova regra'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <label>Nome<input data-testid="loyalty-rule-name" style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label>Tipo<select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CashbackRulePayload['type'] })}><option value="percentage">Percentual</option><option value="fixed_amount">Valor fixo</option><option value="tiered" disabled>Faixas (futuro)</option><option value="campaign" disabled>Campanha (futuro)</option></select></label>
        <label>Base<select style={inputStyle} value={form.calculation_base} onChange={e => setForm({ ...form, calculation_base: e.target.value as CashbackRulePayload['calculation_base'] })}><option value="sale_total">Total da venda</option><option value="catalog_item">Item de catálogo</option><option value="catalog_category">Categoria</option><option value="unit">Unidade</option><option value="customer_segment">Segmento</option><option value="first_purchase">Primeira compra</option></select></label>
        <label>{form.type === 'percentage' ? 'Percentual' : 'Valor'}<input data-testid="loyalty-rule-value" type="number" min="0" step=".01" style={inputStyle} value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} /></label>
        <label>Compra mínima<input type="number" min="0" step=".01" style={inputStyle} value={form.minimum_purchase_amount ?? ''} onChange={e => setForm({ ...form, minimum_purchase_amount: e.target.value ? Number(e.target.value) : null })} /></label>
        <label>Prioridade<input type="number" style={inputStyle} value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} /></label>
        <label>Início<input type="date" style={inputStyle} value={form.starts_at ?? ''} onChange={e => setForm({ ...form, starts_at: e.target.value || null })} /></label>
        <label>Fim<input type="date" style={inputStyle} value={form.ends_at ?? ''} onChange={e => setForm({ ...form, ends_at: e.target.value || null })} /></label>
      </div>
      <label style={{ display: 'block', marginTop: 10 }}>Descrição<textarea style={{ ...inputStyle, minHeight: 65 }} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        <label><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Ativa</label>
        <label><input type="checkbox" checked={form.stackable} onChange={e => setForm({ ...form, stackable: e.target.checked })} /> Acumulável</label>
        <label><input type="checkbox" checked={Boolean(form.first_purchase_only)} onChange={e => setForm({ ...form, first_purchase_only: e.target.checked })} /> Apenas primeira compra</label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}><Button secondary onClick={() => { setEditing(null); setForm(emptyRule()); }}>Cancelar</Button><Button disabled={saving || (editing ? !canUpdate : !canCreate)} onClick={() => void save()} testId="loyalty-rule-save"><Save size={14} /> Salvar regra</Button></div>
    </section>}
    <DynamicTableRenderer columns={columns} data={result.data as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma regra cadastrada." actions={[
      { label: 'Editar', icon: <Edit size={13} />, showCondition: () => canUpdate, onClick: row => start(row as unknown as CashbackRule) },
      { label: 'Excluir', icon: <Trash2 size={13} />, variant: 'danger', showCondition: () => canDelete, onClick: row => void remove(row as unknown as CashbackRule) },
    ]} />
  </div>;
}

export function LoyaltyWalletsPage() {
  const navigate = useNavigate();
  const result = useLoad<CashbackWallet[]>(loyaltyService.wallets);
  const columns: ColumnDef[] = [
    { key: 'customerName', label: 'Cliente', render: value => <strong>{String(value)}</strong> },
    { key: 'availableBalance', label: 'Disponível', type: 'currency' },
    { key: 'pendingBalance', label: 'Pendente', type: 'currency' },
    { key: 'expiredBalance', label: 'Expirado', type: 'currency' },
    { key: 'redeemedTotal', label: 'Resgatado', type: 'currency' },
    { key: 'lifetimeEarned', label: 'Lifetime', type: 'currency' },
  ];
  if (result.loading) return <ModuleStateView state="loading" />;
  if (result.error || !result.data) return <ModuleStateView state="error" errorMessage={result.error} onRetry={() => void result.load()} />;
  return <div style={pageStyle} data-testid="loyalty-wallets-page"><Header title="Carteiras de Cashback" subtitle="Saldos disponíveis, pendentes, expirados e resgatados por cliente." />
    <DynamicTableRenderer columns={columns} data={result.data as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma carteira encontrada." actions={[{ label: 'Ver extrato', icon: <Eye size={13} />, onClick: row => navigate(`/loyalty/cashback/wallets/${row.customerId}`) }]} />
  </div>;
}

export function LoyaltyWalletDetailPage() {
  const { customerId = '' } = useParams();
  const { hasPermission } = usePermission();
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const result = useLoad(async () => {
    const [wallet, transactions] = await Promise.all([loyaltyService.wallet(customerId), loyaltyService.transactions(customerId)]);
    return { wallet, transactions };
  }, [customerId]);
  const canAdjust = hasPermission(LOYALTY_PERMISSIONS.adjust);
  const adjust = async () => {
    if (!amount || !reason) { toast.error('Informe valor e motivo do ajuste.'); return; }
    try { await loyaltyService.adjustWallet(customerId, { amount, reason }); toast.success('Ajuste registrado.'); setAmount(0); setReason(''); await result.load(); } catch { toast.error('Não foi possível ajustar a carteira.'); }
  };
  if (result.loading) return <ModuleStateView state="loading" />;
  if (result.error || !result.data) return <ModuleStateView state="error" errorMessage={result.error} onRetry={() => void result.load()} />;
  const { wallet, transactions } = result.data;
  const columns: ColumnDef[] = [
    { key: 'createdAt', label: 'Data', type: 'date', width: '110px' },
    { key: 'type', label: 'Tipo', width: '110px' },
    { key: 'status', label: 'Status', width: '110px' },
    { key: 'amount', label: 'Valor', type: 'currency', width: '120px' },
    { key: 'description', label: 'Descrição' },
    { key: 'reason', label: 'Motivo' },
  ];
  return <div style={pageStyle} data-testid="loyalty-wallet-detail-page"><Header title={wallet.customerName} subtitle="Extrato e ajustes manuais da carteira de cashback." />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
      <MetricCard label="Disponível" value={money(wallet.availableBalance)} />
      <MetricCard label="Pendente" value={money(wallet.pendingBalance)} />
      <MetricCard label="Expirado" value={money(wallet.expiredBalance)} />
      <MetricCard label="Resgatado" value={money(wallet.redeemedTotal)} />
      <MetricCard label="Passivo" value={money(wallet.liabilityTotal)} />
    </div>
    {canAdjust && <section style={{ ...cardStyle, marginBottom: 16 }}><h2 style={{ marginTop: 0, fontSize: 16 }}>Ajuste manual</h2><div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 10, alignItems: 'end' }}><label>Valor<input data-testid="loyalty-adjust-amount" type="number" step=".01" style={inputStyle} value={amount} onChange={e => setAmount(Number(e.target.value))} /></label><label>Motivo<input data-testid="loyalty-adjust-reason" style={inputStyle} value={reason} onChange={e => setReason(e.target.value)} /></label><Button onClick={() => void adjust()} testId="loyalty-adjust-save">Registrar ajuste</Button></div></section>}
    <DynamicTableRenderer columns={columns} data={transactions as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma transação na carteira." />
  </div>;
}

export function LoyaltySettingsPage() {
  const result = useLoad<CashbackSettings>(loyaltyService.settings);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CashbackSettings | null>(null);
  useEffect(() => { if (result.data) setForm(result.data); }, [result.data]);
  const save = async () => {
    if (!form) return;
    setSaving(true);
    try { const updated = await loyaltyService.updateSettings(form); setForm(updated); toast.success('Configurações salvas.'); } catch { toast.error('Não foi possível salvar as configurações.'); } finally { setSaving(false); }
  };
  if (result.loading || !form) return <ModuleStateView state="loading" />;
  if (result.error) return <ModuleStateView state="error" errorMessage={result.error} onRetry={() => void result.load()} />;
  return <div style={pageStyle} data-testid="loyalty-settings-page"><Header title="Configurações de Cashback" subtitle="Defina liberação, expiração, resgate entre unidades e limites de uso." actions={<Button disabled={saving} onClick={() => void save()} testId="loyalty-settings-save"><Save size={14} /> Salvar</Button>} />
    <section style={cardStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <label><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> Cashback habilitado</label>
        <label><input type="checkbox" checked={form.allowCrossUnitRedemption} onChange={e => setForm({ ...form, allowCrossUnitRedemption: e.target.checked })} /> Resgate entre unidades</label>
        <span style={{ color: '#64748B', fontSize: 12 }}>Quando ativo, saldo gerado em uma unidade pode ser usado em outra da mesma rede.</span>
        <label>Dias para liberação<input data-testid="loyalty-release-days" type="number" min="0" style={inputStyle} value={form.cashbackReleaseDays} onChange={e => setForm({ ...form, cashbackReleaseDays: Number(e.target.value) })} /></label>
        <label>Dias para expiração<input type="number" min="0" style={inputStyle} value={form.expirationDays ?? ''} onChange={e => setForm({ ...form, expirationDays: e.target.value ? Number(e.target.value) : null })} /></label>
        <label>Máximo de uso na venda (%)<input type="number" min="0" max="100" step=".01" style={inputStyle} value={form.maxRedemptionPercentage} onChange={e => setForm({ ...form, maxRedemptionPercentage: Number(e.target.value) })} /></label>
        <label>Valor mínimo de resgate<input type="number" min="0" step=".01" style={inputStyle} value={form.minimumRedemptionAmount} onChange={e => setForm({ ...form, minimumRedemptionAmount: Number(e.target.value) })} /></label>
        <label>Alerta de passivo<input type="number" min="0" step=".01" style={inputStyle} value={form.liabilityAlertThreshold ?? ''} onChange={e => setForm({ ...form, liabilityAlertThreshold: e.target.value ? Number(e.target.value) : null })} /></label>
      </div>
      <p style={{ color: '#64748B', fontSize: 12, marginBottom: 0 }}>Cashback concedido fica pendente até o prazo de liberação. O resgate entra como desconto comercial da venda, sem criar lançamento financeiro de concessão.</p>
    </section>
  </div>;
}
