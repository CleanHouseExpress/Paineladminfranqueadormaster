import { useEffect, useState } from 'react';
import { RefreshCw, RotateCcw, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { checklistManagementService } from '../../../services/checklistManagementService';
import { getApiErrorMessage } from '../../../services/apiClient';
import type {
  ChecklistApplicationPolicies,
  ChecklistApplicationPolicyFilters,
  ChecklistPolicyActivation,
  ChecklistPolicyRequirement,
  ChecklistUnitApplicationPolicy,
} from '../../../types/checklistManagement';

const selectClass = 'h-9 rounded-md border bg-background px-3 text-sm';

function sourceLabel(source: string) {
  if (source === 'unit') return 'unidade';
  if (source === 'network') return 'rede';
  if (source === 'form_default') return 'padrão do formulário';
  return source;
}

function effectiveActivation(enabled: boolean) {
  return enabled ? 'Ativado' : 'Desativado';
}

function effectiveRequirement(required: boolean) {
  return required ? 'Obrigatório' : 'Não obrigatório';
}

export function ChecklistApplicationPolicyConfig({ templateId }: { templateId: string | number }) {
  const [policies, setPolicies] = useState<ChecklistApplicationPolicies | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ChecklistApplicationPolicyFilters>({});

  async function load(nextFilters: ChecklistApplicationPolicyFilters = filters) {
    setLoading(true);
    setError('');
    try {
      setPolicies(await checklistManagementService.getApplicationPolicies(templateId, nextFilters));
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Não foi possível carregar as políticas de aplicação.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load({});
  }, [templateId]);

  function patchNetwork(patch: Partial<ChecklistApplicationPolicies['network']>) {
    setPolicies(current => current ? { ...current, network: { ...current.network, ...patch } } : current);
  }

  function patchUnit(unitId: number, patch: Partial<ChecklistUnitApplicationPolicy>) {
    setPolicies(current => current ? {
      ...current,
      units: current.units.map(unit => unit.id === unitId ? { ...unit, ...patch } : unit),
    } : current);
  }

  async function saveNetwork() {
    if (!policies) return;
    if (policies.network.activation === 'disabled' && policies.network.requirement === 'required') {
      setError('Uma política desativada não pode ser obrigatória.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await checklistManagementService.updateNetworkApplicationPolicy(templateId, {
        activation: policies.network.activation,
        requirement: policies.network.requirement,
      });
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Não foi possível salvar a política da rede.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveUnit(unit: ChecklistUnitApplicationPolicy) {
    setSaving(true);
    setError('');
    try {
      await checklistManagementService.updateUnitApplicationPolicy(templateId, unit.id, {
        activation: unit.activation,
        requirement: unit.requirement,
      });
      patchUnit(unit.id, { has_exception: unit.activation !== 'inherit' || unit.requirement !== 'inherit' });
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Não foi possível salvar a exceção da unidade.'));
    } finally {
      setSaving(false);
    }
  }

  async function restore(unit: ChecklistUnitApplicationPolicy, property: 'activation' | 'requirement') {
    setSaving(true);
    setError('');
    try {
      await checklistManagementService.restoreUnitApplicationPolicy(templateId, unit.id, property);
      const patch = property === 'activation' ? { activation: 'inherit' as const } : { requirement: 'inherit' as const };
      patchUnit(unit.id, { ...patch, has_exception: property === 'activation' ? unit.requirement !== 'inherit' : unit.activation !== 'inherit' });
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Não foi possível restaurar a herança.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !policies) return <div className="rounded-md border p-6 text-sm text-muted-foreground">Carregando políticas de aplicação...</div>;

  return (
    <div className="grid gap-5">
      {error ? <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
      {policies ? (
        <section data-testid="network-application-policy" className="grid gap-4 rounded-md border bg-card p-4">
          <div><h2 className="font-medium">Política da rede</h2><p className="text-sm text-muted-foreground">Configuração explícita aplicada como base para as unidades.</p></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1"><Label htmlFor="network-activation">Ativação da rede</Label><select id="network-activation" className={selectClass} value={policies.network.activation} onChange={event => patchNetwork({ activation: event.target.value as ChecklistPolicyActivation })}><option value="enabled">Ativado</option><option value="disabled">Desativado</option></select></div>
            <div className="grid gap-1"><Label htmlFor="network-requirement">Obrigatoriedade da rede</Label><select id="network-requirement" className={selectClass} value={policies.network.requirement} onChange={event => patchNetwork({ requirement: event.target.value as ChecklistPolicyRequirement })}><option value="optional">Opcional</option><option value="required">Obrigatório</option></select></div>
          </div>
          <div className="flex justify-end"><Button disabled={saving} onClick={() => void saveNetwork()}><Save className="size-4" />Salvar política da rede</Button></div>
        </section>
      ) : null}

      <section className="grid gap-4 rounded-md border bg-card p-4">
        <div><h2 className="font-medium">Exceções por unidade</h2><p className="text-sm text-muted-foreground">Valores efetivos e origens são informados pela API.</p></div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="grid gap-1"><Label htmlFor="unit-search">Buscar unidade</Label><Input id="unit-search" value={filters.search ?? ''} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} /></div>
          <div className="grid gap-1"><Label htmlFor="effective-activation">Ativação efetiva</Label><select id="effective-activation" className={selectClass} value={filters.effective_activation ?? ''} onChange={event => setFilters(current => ({ ...current, effective_activation: event.target.value as ChecklistPolicyActivation | '' }))}><option value="">Todas</option><option value="enabled">Ativada</option><option value="disabled">Desativada</option></select></div>
          <div className="grid gap-1"><Label htmlFor="effective-requirement">Obrigatoriedade efetiva</Label><select id="effective-requirement" className={selectClass} value={filters.effective_requirement ?? ''} onChange={event => setFilters(current => ({ ...current, effective_requirement: event.target.value as ChecklistPolicyRequirement | '' }))}><option value="">Todas</option><option value="required">Obrigatória</option><option value="optional">Opcional</option></select></div>
          <div className="grid gap-1"><Label htmlFor="exception-filter">Existência de exceção</Label><select id="exception-filter" className={selectClass} value={filters.has_exception === true ? 'with_exception' : filters.has_exception === false ? 'without_exception' : ''} onChange={event => setFilters(current => ({ ...current, has_exception: event.target.value === '' ? undefined : event.target.value === 'with_exception' }))}><option value="">Todas</option><option value="with_exception">Com exceção</option><option value="without_exception">Sem exceção</option></select></div>
        </div>
        <div className="flex justify-end"><Button variant="outline" disabled={loading} onClick={() => void load(filters)}>{loading ? <RefreshCw className="size-4 animate-spin" /> : null}Aplicar filtros</Button></div>
        <div className="grid gap-3">
          {(policies?.units ?? []).map(unit => (
            <article key={unit.id} data-testid={`unit-application-policy-${unit.id}`} className="grid gap-3 rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-medium">{unit.name}</h3><p className="text-xs text-muted-foreground">{unit.code ?? 'Sem código'} · {unit.status ?? 'Sem status'}</p></div>{unit.has_exception ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">Exceção</span> : null}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2 rounded-md bg-muted/30 p-3"><Label htmlFor={`activation-${unit.id}`}>Ativação de {unit.name}</Label><select id={`activation-${unit.id}`} className={selectClass} value={unit.activation} onChange={event => patchUnit(unit.id, { activation: event.target.value as ChecklistUnitApplicationPolicy['activation'] })}><option value="inherit">Herdar</option><option value="enabled">Ativada</option><option value="disabled">Desativada</option></select><p className="text-sm"><strong>{effectiveActivation(unit.effective_enabled)}</strong> · origem: {sourceLabel(unit.activation_source)}</p>{unit.activation !== 'inherit' ? <Button size="sm" variant="outline" onClick={() => void restore(unit, 'activation')}><RotateCcw className="size-4" />Restaurar ativação</Button> : null}</div>
                <div className="grid gap-2 rounded-md bg-muted/30 p-3"><Label htmlFor={`requirement-${unit.id}`}>Obrigatoriedade de {unit.name}</Label><select id={`requirement-${unit.id}`} className={selectClass} value={unit.requirement} onChange={event => patchUnit(unit.id, { requirement: event.target.value as ChecklistUnitApplicationPolicy['requirement'] })}><option value="inherit">Herdar</option><option value="optional">Opcional</option><option value="required">Obrigatória</option></select><p className="text-sm"><strong>{effectiveRequirement(unit.effective_required)}</strong> · origem: {sourceLabel(unit.requirement_source)}</p>{unit.requirement !== 'inherit' ? <Button size="sm" variant="outline" onClick={() => void restore(unit, 'requirement')}><RotateCcw className="size-4" />Restaurar obrigatoriedade</Button> : null}</div>
              </div>
              <div className="flex justify-end"><Button disabled={saving} onClick={() => void saveUnit(unit)}><Save className="size-4" />Salvar exceção</Button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
