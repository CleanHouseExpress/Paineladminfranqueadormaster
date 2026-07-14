import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardList,
  Gauge,
  History,
  Loader2,
  PlayCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../../app/components/ui/alert';
import { Badge } from '../../app/components/ui/badge';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { getApiErrorMessage } from '../../services/apiClient';
import { subscriptionPolicyService } from '../../services/subscriptionPolicyService';
import type {
  EffectivePolicy,
  PolicyDraftPayload,
  PolicyGovernance,
  PolicyIssue,
  PolicySettings,
  PolicySimulationResult,
  PolicyValidationReport,
  SubscriptionPolicyPreset,
  SubscriptionPolicyVersion,
  TenantPolicyScope,
  TenantPolicyStatus,
  TenantPolicyType,
} from '../../types/subscriptionPolicies';

type StepKey = 'preset' | 'subscription' | 'lifecycle' | 'billing' | 'matrix' | 'discounts' | 'metrics' | 'governance' | 'simulate' | 'publish';

const steps: Array<{ key: StepKey; label: string; icon: typeof ClipboardList }> = [
  { key: 'preset', label: 'Escopo', icon: ClipboardList },
  { key: 'subscription', label: 'Mudancas', icon: SlidersHorizontal },
  { key: 'lifecycle', label: 'Ciclo de vida', icon: RefreshCw },
  { key: 'billing', label: 'Billing policy', icon: Gauge },
  { key: 'matrix', label: 'Pos-fatura', icon: ShieldCheck },
  { key: 'discounts', label: 'Descontos', icon: SlidersHorizontal },
  { key: 'metrics', label: 'Metricas', icon: Gauge },
  { key: 'governance', label: 'Governanca', icon: ShieldCheck },
  { key: 'simulate', label: 'Simular', icon: PlayCircle },
  { key: 'publish', label: 'Publicar', icon: UploadCloud },
];

const today = new Date().toISOString().slice(0, 10);

const subscriptionDefaults: PolicySettings = {
  upgrade: {
    effective_timing: 'next_cycle',
    billing_behavior: 'next_cycle_only',
    renewal_anchor_behavior: 'keep_current_anchor',
    requires_approval: false,
    grant_access_before_payment: false,
  },
  downgrade: {
    effective_timing: 'next_cycle',
    difference_behavior: 'none',
    requires_approval: false,
    preserve_excess_data: true,
    access_reduction_timing: 'next_cycle',
  },
  cancellation: {
    effective_timing: 'end_of_cycle',
    invoice_behavior: 'keep_existing',
    credit_behavior: 'none',
    access_behavior: 'keep_until_effective_date',
    requires_approval: false,
    allow_with_open_invoice: true,
  },
  reactivation: {
    cycle_behavior: 'start_new_cycle',
    debt_behavior: 'block_when_open_debt',
    snapshot_behavior: 'use_current_policy',
    requires_approval: true,
  },
  trial: { allow_trial: true, activation_behavior: 'manual_or_immediate' },
  renewal: { anchor_strategy: 'keep_current_anchor', policy_change_strategy: 'keep_current_version' },
};

const billingDefaults: PolicySettings = {
  billing: { due_day: 10, collection_model: 'prepaid' },
  rounding: { mode: 'half_up', stage: 'per_line', scale: 2, residual_behavior: 'none' },
  credits: { allowed_methods: ['none'], default_method: 'none' },
  discounts: {
    roles: {
      unit_manager: { max_without_approval_percent: 5, max_with_approval_percent: 10 },
      finance: { max_without_approval_percent: 10, max_with_approval_percent: 20 },
    },
  },
  after_billing_matrix: {
    upgrade: { invoice_not_issued: 'apply_current_cycle', invoice_open: 'apply_next_cycle', invoice_paid: 'apply_next_cycle', invoice_overdue: 'manual_review' },
    downgrade: { invoice_not_issued: 'apply_current_cycle', invoice_open: 'apply_next_cycle', invoice_paid: 'apply_next_cycle', invoice_overdue: 'manual_review' },
    cancellation: { invoice_not_issued: 'apply_current_cycle', invoice_open: 'manual_review', invoice_paid: 'apply_next_cycle', invoice_overdue: 'manual_review' },
  },
};

const metricsDefaults: PolicySettings = {
  primary_mrr_metric: 'committed_mrr',
  forecast_scheduled_changes: 'next_cycle',
  trial_treatment: 'exclude_until_activation',
  pause_treatment: 'keep_committed_reduce_effective',
  churn_recognition: 'effective_cancellation_date',
};

const defaultGovernance: PolicyGovernance = {
  'upgrade.effective_timing': 'unit_can_override',
  'upgrade.billing_behavior': 'locked',
  'downgrade.effective_timing': 'unit_can_override',
  'downgrade.difference_behavior': 'locked',
  'cancellation.effective_timing': 'unit_can_override',
  'reactivation.cycle_behavior': 'locked',
};

const selectClass = 'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const labelClass = 'text-xs font-medium uppercase tracking-normal text-slate-500';

function valueAt(settings: PolicySettings, path: string) {
  return path.split('.').reduce<unknown>((current, key) => (
    current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
  ), settings);
}

function setAt(settings: PolicySettings, path: string, value: unknown): PolicySettings {
  const next = structuredClone(settings) as PolicySettings;
  const parts = path.split('.');
  let current = next as Record<string, unknown>;
  parts.slice(0, -1).forEach(part => {
    const child = current[part];
    if (!child || typeof child !== 'object') current[part] = {};
    current = current[part] as Record<string, unknown>;
  });
  current[parts[parts.length - 1]] = value;
  return next;
}

function settingText(settings: PolicySettings, path: string, fallback = '') {
  const value = valueAt(settings, path);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function settingBool(settings: PolicySettings, path: string) {
  return valueAt(settings, path) === true;
}

function statusBadge(status: TenantPolicyStatus) {
  const variant = status === 'published' ? 'default' : status === 'draft' ? 'secondary' : 'outline';
  return <Badge variant={variant}>{status}</Badge>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5"><span className={labelClass}>{label}</span>{children}</label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select className={selectClass} value={value} onChange={event => onChange(event.target.value)}>
        {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
      </select>
    </Field>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
      <span>{label}</span>
      <input className="size-4 accent-indigo-600" type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    </label>
  );
}

function IssueList({ title, issues }: { title: string; issues: PolicyIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      {issues.map(issue => <p key={`${issue.field}-${issue.message}`} className="text-sm text-slate-600">{issue.field}: {issue.message}</p>)}
    </div>
  );
}

export function SubscriptionPoliciesPage() {
  const [policies, setPolicies] = useState<SubscriptionPolicyVersion[]>([]);
  const [presets, setPresets] = useState<SubscriptionPolicyPreset[]>([]);
  const [effective, setEffective] = useState<EffectivePolicy | null>(null);
  const [selected, setSelected] = useState<SubscriptionPolicyVersion | null>(null);
  const [activeStep, setActiveStep] = useState<StepKey>('preset');
  const [policyType, setPolicyType] = useState<TenantPolicyType>('subscription');
  const [scopeType, setScopeType] = useState<TenantPolicyScope>('company');
  const [scopeId, setScopeId] = useState('');
  const [name, setName] = useState('Politica de assinaturas');
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [settings, setSettings] = useState<PolicySettings>(subscriptionDefaults);
  const [governance, setGovernance] = useState<PolicyGovernance>(defaultGovernance);
  const [validation, setValidation] = useState<PolicyValidationReport | null>(null);
  const [simulation, setSimulation] = useState<PolicySimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedPreset = useMemo(() => presets[0], [presets]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [presetData, policyList, effectivePolicy] = await Promise.all([
        subscriptionPolicyService.presets(),
        subscriptionPolicyService.list({ per_page: 50 }),
        subscriptionPolicyService.effective({ policy_type: policyType }).catch(() => null),
      ]);
      setPresets(presetData);
      setPolicies(policyList.data);
      setEffective(effectivePolicy);
      if (!selected && policyList.data.length > 0) setSelected(policyList.data[0]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel carregar politicas de assinaturas.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (policyType === 'subscription') setSettings(subscriptionDefaults);
    if (policyType === 'billing') setSettings(billingDefaults);
    if (policyType === 'metrics') setSettings(metricsDefaults);
  }, [policyType]);

  function updateSetting(path: string, value: unknown) {
    setSettings(current => setAt(current, path, value));
  }

  function applyPreset(preset: SubscriptionPolicyPreset, type = policyType) {
    setPolicyType(type);
    setSettings(preset.settings[type] ?? subscriptionDefaults);
    setName(`${preset.name} - ${type}`);
    setMessage(`Preset ${preset.name} aplicado ao draft.`);
  }

  async function createDraft(fromPreset = false) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const base = {
        policy_type: policyType,
        scope_type: scopeType,
        scope_id: scopeType === 'company' || !scopeId ? null : Number(scopeId),
        name,
        effective_from: effectiveFrom,
        governance,
      };
      const created = fromPreset && selectedPreset
        ? await subscriptionPolicyService.fromPreset({ ...base, preset: selectedPreset.slug })
        : await subscriptionPolicyService.create({ ...base, settings } as PolicyDraftPayload);
      setSelected(created);
      setMessage('Draft criado.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel criar o draft.'));
    } finally {
      setLoading(false);
    }
  }

  async function validateSelected() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      setValidation(await subscriptionPolicyService.validate(selected.id));
      setMessage('Validacao concluida.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel validar a politica.'));
    } finally {
      setLoading(false);
    }
  }

  async function publishSelected() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const published = await subscriptionPolicyService.publish(selected.id);
      setSelected(published);
      setMessage('Politica publicada e versao anterior superseded quando aplicavel.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel publicar a politica.'));
    } finally {
      setLoading(false);
    }
  }

  async function archiveSelected() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const archived = await subscriptionPolicyService.archive(selected.id);
      setSelected(archived);
      setMessage('Politica arquivada.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel arquivar a politica.'));
    } finally {
      setLoading(false);
    }
  }

  async function simulate() {
    setLoading(true);
    setError('');
    try {
      setSimulation(await subscriptionPolicyService.simulate(selected?.id ?? null, {
        settings,
        operation_type: 'upgrade',
        current_value: 100,
        new_value: 150,
        cycle_start: '2026-07-01',
        cycle_end: '2026-07-31',
        change_date: '2026-07-10',
        invoice_state: 'invoice_open',
        operator_role: 'company_admin',
      }));
      setMessage('Simulacao executada sem gerar invoice, credito, refund ou pagamento.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel simular a politica.'));
    } finally {
      setLoading(false);
    }
  }

  function renderStep() {
    if (activeStep === 'preset') {
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Nome"><Input value={name} onChange={event => setName(event.target.value)} data-testid="policy-name-input" /></Field>
            <SelectField label="Tipo" value={policyType} onChange={value => setPolicyType(value as TenantPolicyType)} options={[['subscription', 'Subscription'], ['billing', 'Billing'], ['metrics', 'Metrics']]} />
            <SelectField label="Escopo" value={scopeType} onChange={value => setScopeType(value as TenantPolicyScope)} options={[['company', 'Rede'], ['unit', 'Unidade'], ['contract', 'Contrato']]} />
            <Field label="ID do escopo"><Input value={scopeId} disabled={scopeType === 'company'} onChange={event => setScopeId(event.target.value)} placeholder="Obrigatorio fora da rede" /></Field>
          </div>
          <Field label="Vigencia inicial"><Input type="date" value={effectiveFrom} onChange={event => setEffectiveFrom(event.target.value)} /></Field>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {presets.map(preset => (
              <button key={preset.slug} type="button" onClick={() => applyPreset(preset)} className="rounded-md border border-slate-200 bg-white p-4 text-left hover:border-indigo-300" data-testid={`policy-preset-${preset.slug}`}>
                <strong className="text-sm">{preset.name}</strong>
                <p className="mt-1 text-xs text-slate-500">{preset.recommended_for}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeStep === 'subscription') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Upgrade efetivo" value={settingText(settings, 'upgrade.effective_timing')} onChange={value => updateSetting('upgrade.effective_timing', value)} options={[['immediate', 'Imediato'], ['next_cycle', 'Proximo ciclo'], ['scheduled_date', 'Data agendada'], ['operator_choice', 'Operador escolhe']]} />
          <SelectField label="Upgrade financeiro" value={settingText(settings, 'upgrade.billing_behavior')} onChange={value => updateSetting('upgrade.billing_behavior', value)} options={[['next_cycle_only', 'Apenas proximo ciclo'], ['no_additional_charge', 'Sem cobranca adicional'], ['prorated_charge', 'Prorata futuro bloqueado'], ['manual_complement', 'Complemento futuro bloqueado']]} />
          <SelectField label="Downgrade efetivo" value={settingText(settings, 'downgrade.effective_timing')} onChange={value => updateSetting('downgrade.effective_timing', value)} options={[['next_cycle', 'Proximo ciclo'], ['end_of_paid_period', 'Fim do periodo pago'], ['scheduled_date', 'Data agendada'], ['immediate', 'Imediato'], ['operator_choice', 'Operador escolhe']]} />
          <SelectField label="Diferenca no downgrade" value={settingText(settings, 'downgrade.difference_behavior')} onChange={value => updateSetting('downgrade.difference_behavior', value)} options={[['none', 'Sem credito'], ['prorated_credit', 'Credito futuro bloqueado'], ['full_credit', 'Credito integral futuro bloqueado'], ['manual_refund', 'Refund futuro bloqueado']]} />
          <ToggleField label="Upgrade exige aprovacao" checked={settingBool(settings, 'upgrade.requires_approval')} onChange={value => updateSetting('upgrade.requires_approval', value)} />
          <ToggleField label="Downgrade exige aprovacao" checked={settingBool(settings, 'downgrade.requires_approval')} onChange={value => updateSetting('downgrade.requires_approval', value)} />
        </div>
      );
    }

    if (activeStep === 'lifecycle') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Cancelamento efetivo" value={settingText(settings, 'cancellation.effective_timing')} onChange={value => updateSetting('cancellation.effective_timing', value)} options={[['immediate', 'Imediato'], ['end_of_cycle', 'Fim do ciclo'], ['scheduled_date', 'Data agendada'], ['operator_choice', 'Operador escolhe']]} />
          <SelectField label="Fatura no cancelamento" value={settingText(settings, 'cancellation.invoice_behavior')} onChange={value => updateSetting('cancellation.invoice_behavior', value)} options={[['keep_existing', 'Manter existente'], ['manual_review', 'Revisao manual'], ['cancel_open_invoice', 'Cancelar aberta futuro']]} />
          <SelectField label="Reativacao" value={settingText(settings, 'reactivation.cycle_behavior')} onChange={value => updateSetting('reactivation.cycle_behavior', value)} options={[['start_new_cycle', 'Novo ciclo'], ['resume_existing_cycle', 'Retomar ciclo'], ['operator_choice', 'Operador escolhe']]} />
          <SelectField label="Politica no renewal" value={settingText(settings, 'renewal.policy_change_strategy')} onChange={value => updateSetting('renewal.policy_change_strategy', value)} options={[['keep_current_version', 'Manter versao congelada'], ['use_latest_on_renewal', 'Usar mais recente no renewal']]} />
          <ToggleField label="Permitir trial" checked={settingBool(settings, 'trial.allow_trial')} onChange={value => updateSetting('trial.allow_trial', value)} />
          <ToggleField label="Cancelamento exige aprovacao" checked={settingBool(settings, 'cancellation.requires_approval')} onChange={value => updateSetting('cancellation.requires_approval', value)} />
        </div>
      );
    }

    if (activeStep === 'billing') {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Dia de vencimento"><Input type="number" min={1} max={31} value={settingText(settings, 'billing.due_day', '10')} onChange={event => updateSetting('billing.due_day', Number(event.target.value))} /></Field>
          <SelectField label="Modelo de cobranca" value={settingText(settings, 'billing.collection_model', 'prepaid')} onChange={value => updateSetting('billing.collection_model', value)} options={[['prepaid', 'Pre-pago'], ['postpaid', 'Pos-pago']]} />
          <SelectField label="Arredondamento" value={settingText(settings, 'rounding.mode', 'half_up')} onChange={value => updateSetting('rounding.mode', value)} options={[['half_up', 'Half up'], ['half_even', 'Half even'], ['ceiling', 'Ceiling'], ['floor', 'Floor']]} />
          <SelectField label="Estagio" value={settingText(settings, 'rounding.stage', 'per_line')} onChange={value => updateSetting('rounding.stage', value)} options={[['per_line', 'Por linha'], ['invoice_total', 'Total da invoice'], ['per_line_with_residual_adjustment', 'Residual futuro']]} />
          <Field label="Escala"><Input type="number" min={0} max={4} value={settingText(settings, 'rounding.scale', '2')} onChange={event => updateSetting('rounding.scale', Number(event.target.value))} /></Field>
          <SelectField label="Credito padrao" value={settingText(settings, 'credits.default_method', 'none')} onChange={value => updateSetting('credits.default_method', value)} options={[['none', 'Nenhum'], ['customer_balance', 'Saldo futuro bloqueado'], ['manual_refund', 'Refund futuro bloqueado']]} />
        </div>
      );
    }

    if (activeStep === 'matrix') {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          {['upgrade', 'downgrade', 'cancellation'].map(change => (
            <div key={change} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold capitalize">{change}</h3>
              {['invoice_not_issued', 'invoice_open', 'invoice_paid', 'invoice_overdue'].map(state => (
                <SelectField key={state} label={state} value={settingText(settings, `after_billing_matrix.${change}.${state}`, 'apply_next_cycle')} onChange={value => updateSetting(`after_billing_matrix.${change}.${state}`, value)} options={[['apply_current_cycle', 'Aplicar ciclo atual'], ['apply_next_cycle', 'Aplicar proximo ciclo'], ['manual_review', 'Revisao manual'], ['issue_complement', 'Complemento futuro bloqueado'], ['create_credit', 'Credito futuro bloqueado']]} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (activeStep === 'discounts') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Gerente sem aprovacao (%)"><Input type="number" value={settingText(settings, 'discounts.roles.unit_manager.max_without_approval_percent', '5')} onChange={event => updateSetting('discounts.roles.unit_manager.max_without_approval_percent', Number(event.target.value))} /></Field>
          <Field label="Gerente com aprovacao (%)"><Input type="number" value={settingText(settings, 'discounts.roles.unit_manager.max_with_approval_percent', '10')} onChange={event => updateSetting('discounts.roles.unit_manager.max_with_approval_percent', Number(event.target.value))} /></Field>
          <Field label="Financeiro sem aprovacao (%)"><Input type="number" value={settingText(settings, 'discounts.roles.finance.max_without_approval_percent', '10')} onChange={event => updateSetting('discounts.roles.finance.max_without_approval_percent', Number(event.target.value))} /></Field>
          <Field label="Financeiro com aprovacao (%)"><Input type="number" value={settingText(settings, 'discounts.roles.finance.max_with_approval_percent', '20')} onChange={event => updateSetting('discounts.roles.finance.max_with_approval_percent', Number(event.target.value))} /></Field>
        </div>
      );
    }

    if (activeStep === 'metrics') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="MRR primario" value={settingText(settings, 'primary_mrr_metric', 'committed_mrr')} onChange={value => updateSetting('primary_mrr_metric', value)} options={[['requested_mrr', 'Requested MRR'], ['committed_mrr', 'Committed MRR'], ['effective_mrr', 'Effective MRR'], ['billable_mrr', 'Billable MRR'], ['collected_recurring_revenue', 'Receita recorrente recebida']]} />
          <SelectField label="Forecast" value={settingText(settings, 'forecast_scheduled_changes', 'next_cycle')} onChange={value => updateSetting('forecast_scheduled_changes', value)} options={[['immediate', 'Imediato'], ['next_cycle', 'Proximo ciclo'], ['effective_date', 'Data efetiva']]} />
          <SelectField label="Trial" value={settingText(settings, 'trial_treatment', 'exclude_until_activation')} onChange={value => updateSetting('trial_treatment', value)} options={[['exclude_until_activation', 'Excluir ate ativar'], ['include_requested', 'Incluir solicitado'], ['include_after_trial', 'Incluir apos trial']]} />
          <SelectField label="Pausa" value={settingText(settings, 'pause_treatment', 'keep_committed_reduce_effective')} onChange={value => updateSetting('pause_treatment', value)} options={[['keep_committed_reduce_effective', 'Mantem committed'], ['exclude_from_effective', 'Excluir effective'], ['exclude_from_all', 'Excluir tudo']]} />
        </div>
      );
    }

    if (activeStep === 'governance') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(governance).map(([field, mode]) => (
            <SelectField key={field} label={field} value={mode} onChange={value => setGovernance(current => ({ ...current, [field]: value }))} options={[['locked', 'Bloqueado'], ['unit_can_override', 'Unidade pode sobrescrever'], ['unit_can_restrict_only', 'Unidade so restringe'], ['operator_can_choose', 'Operador escolhe'], ['requires_approval', 'Exige aprovacao']]} />
          ))}
        </div>
      );
    }

    if (activeStep === 'simulate') {
      return (
        <div className="space-y-4">
          <Button type="button" onClick={() => void simulate()} disabled={loading} data-testid="policy-simulate-button">
            {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />} Simular upgrade
          </Button>
          {simulation && (
            <div className="grid gap-3 md:grid-cols-4" data-testid="policy-simulation-result">
              <div className="rounded-md border bg-white p-3"><span className={labelClass}>Data efetiva</span><strong className="block">{simulation.effective_date}</strong></div>
              <div className="rounded-md border bg-white p-3"><span className={labelClass}>Comportamento</span><strong className="block">{simulation.financial_behavior.behavior}</strong></div>
              <div className="rounded-md border bg-white p-3"><span className={labelClass}>Cobranca estimada</span><strong className="block">{simulation.estimated_charge}</strong></div>
              <div className="rounded-md border bg-white p-3"><span className={labelClass}>Execucao real</span><strong className="block">{simulation.financial_behavior.real_financial_execution ? 'Sim' : 'Nao'}</strong></div>
              <p className="md:col-span-4 text-sm text-slate-600">{simulation.access_change}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void createDraft(false)} disabled={loading} data-testid="policy-create-draft"><Save /> Criar draft</Button>
          <Button type="button" variant="outline" onClick={() => void createDraft(true)} disabled={loading || presets.length === 0}><ClipboardList /> Criar do preset</Button>
          <Button type="button" variant="outline" onClick={() => void validateSelected()} disabled={loading || !selected}><CheckCircle2 /> Validar selecionada</Button>
          <Button type="button" onClick={() => void publishSelected()} disabled={loading || !selected || selected.status !== 'draft'} data-testid="policy-publish-button"><UploadCloud /> Publicar</Button>
          <Button type="button" variant="outline" onClick={() => void archiveSelected()} disabled={loading || !selected}><Archive /> Arquivar</Button>
        </div>
        {validation && (
          <div className="grid gap-3 md:grid-cols-3">
            <IssueList title="Erros" issues={validation.errors} />
            <IssueList title="Alertas" issues={validation.warnings} />
            <IssueList title="Recomendacoes" issues={validation.recommendations} />
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6" data-testid="subscription-policies-page">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Politicas de Assinaturas</h1>
            <p className="text-sm text-slate-600">Configurador versionado de regras comerciais para recorrencia, billing policy e metricas.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} /> Atualizar</Button>
        </header>

        {error && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        {message && <Alert><CheckCircle2 /><AlertTitle>Atualizacao</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}

        <section className="grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Versoes</h2>
                <Badge variant="outline">{policies.length}</Badge>
              </div>
              <div className="space-y-2" data-testid="policy-version-list">
                {policies.map(policy => (
                  <button key={policy.id} type="button" onClick={() => setSelected(policy)} className={`w-full rounded-md border p-3 text-left text-sm ${selected?.id === policy.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="truncate">{policy.name}</strong>
                      {statusBadge(policy.status)}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{policy.policy_type} v{policy.version} - {policy.scope_type}{policy.scope_id ? ` #${policy.scope_id}` : ''}</p>
                  </button>
                ))}
                {policies.length === 0 && <p className="rounded-md border border-dashed p-4 text-sm text-slate-500">Nenhuma politica criada.</p>}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2"><History className="size-4" /><h2 className="font-semibold">Efetiva agora</h2></div>
              <p className="text-sm text-slate-600">Policy version: <strong>{effective?.policy_version_id ?? 'default Orchestra'}</strong></p>
              <p className="mt-1 text-xs text-slate-500">{effective?.resolved_at ? new Date(effective.resolved_at).toLocaleString() : 'Sem resolucao carregada'}</p>
            </div>
          </aside>

          <section className="rounded-md border border-slate-200 bg-white">
            <nav className="grid border-b border-slate-200 md:grid-cols-5 xl:grid-cols-10">
              {steps.map(step => {
                const Icon = step.icon;
                return (
                  <button key={step.key} type="button" onClick={() => setActiveStep(step.key)} className={`flex items-center gap-2 px-3 py-3 text-left text-sm ${activeStep === step.key ? 'bg-slate-100 font-semibold text-slate-950' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Icon className="size-4" />{step.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-5">{renderStep()}</div>
          </section>
        </section>
      </div>
    </main>
  );
}
