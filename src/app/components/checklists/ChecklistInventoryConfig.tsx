import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Eye, Info, Package, Plus, Save, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import { apiClient } from '../../../services/apiClient';
import {
  checklistInventoryAutomationService,
  type InventoryAutomationMovementType,
  type InventoryAutomationRule,
} from '../../../services/checklistInventoryAutomationService';

interface NumericField {
  key: string;
  label: string;
  type: string;
}

interface ChecklistInventoryConfigProps {
  templateId: string | number;
  templateName: string;
  numericFields: NumericField[];
}

interface InventoryItemOption {
  id: string;
  name: string;
  unitOfMeasure: string;
}

interface InventoryItemsResponse {
  data: Array<{
    id: string | number;
    name: string;
    unit_of_measure: string;
  }>;
}

const MOVEMENTS: Record<InventoryAutomationMovementType, {
  label: string;
  className: string;
}> = {
  exit: { label: 'Saída', className: 'border-red-200 bg-red-50 text-red-700' },
  entry: { label: 'Entrada', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  adjustment: { label: 'Ajuste', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  loss: { label: 'Perda', className: 'border-amber-200 bg-amber-50 text-amber-700' },
};

const inputClass = 'h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

function ruleKey(rule: InventoryAutomationRule, index: number) {
  return rule.id ? `rule-${rule.id}` : `new-${index}`;
}

function rulesSnapshot(rules: InventoryAutomationRule[]) {
  return JSON.stringify(rules.map(rule => ({
    sourceFieldKey: rule.sourceFieldKey,
    inventoryItemId: rule.inventoryItemId,
    movementType: rule.movementType,
    multiplier: rule.multiplier,
    active: rule.active,
  })));
}

export function ChecklistInventoryConfig({
  templateId,
  templateName,
  numericFields,
}: ChecklistInventoryConfigProps) {
  const { hasPermission } = usePermission();
  const canView = hasPermission('tenant.inventory.automation.view');
  const canManage = hasPermission('tenant.inventory.automation.manage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<InventoryAutomationRule[]>([]);
  const [savedRules, setSavedRules] = useState<InventoryAutomationRule[]>([]);
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    void Promise.all([
      checklistInventoryAutomationService.getRules(templateId),
      apiClient.get<InventoryItemsResponse>('/api/company/inventory/items?active=1&per_page=100')
        .then(response => response.data.map(item => ({
          id: String(item.id),
          name: item.name,
          unitOfMeasure: item.unit_of_measure,
        })))
        .catch(() => []),
    ]).then(([nextRules, nextItems]) => {
      if (cancelled) return;
      setRules(nextRules);
      setSavedRules(nextRules);
      setItems(nextItems);
    }).catch(() => {
      if (!cancelled) setError('Não foi possível carregar as regras de automação.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [canView, templateId]);

  const invalidRules = useMemo(() => rules.filter((rule, index) => {
    const duplicated = rules.some((candidate, candidateIndex) => (
      candidateIndex !== index
      && candidate.sourceFieldKey === rule.sourceFieldKey
      && candidate.inventoryItemId === rule.inventoryItemId
      && Boolean(rule.sourceFieldKey)
      && Boolean(rule.inventoryItemId)
    ));
    return (
      !rule.sourceFieldKey
      || !rule.inventoryItemId
      || !Number.isFinite(rule.multiplier)
      || rule.multiplier <= 0
      || duplicated
    );
  }), [rules]);
  const enabled = rules.some(rule => rule.active);
  const changed = rulesSnapshot(rules) !== rulesSnapshot(savedRules);
  const activeRules = rules.filter(rule => rule.active && rule.sourceFieldKey && rule.inventoryItemId);

  function patchRule(index: number, patch: Partial<InventoryAutomationRule>) {
    setRules(current => current.map((rule, ruleIndex) => {
      if (ruleIndex !== index) return rule;
      const next = { ...rule, ...patch };
      const field = numericFields.find(item => item.key === next.sourceFieldKey);
      const item = items.find(option => option.id === next.inventoryItemId);
      return {
        ...next,
        fieldLabel: field?.label ?? next.fieldLabel,
        fieldType: field?.type ?? next.fieldType,
        inventoryItemName: item?.name ?? next.inventoryItemName,
        inventoryItemUnit: item?.unitOfMeasure ?? next.inventoryItemUnit,
      };
    }));
  }

  function addRule() {
    setRules(current => [...current, {
      sourceFieldKey: '',
      fieldLabel: '',
      fieldType: null,
      inventoryItemId: '',
      inventoryItemName: '',
      inventoryItemUnit: null,
      movementType: 'exit',
      multiplier: 1,
      active: true,
    }]);
  }

  async function save() {
    if (!canManage || invalidRules.length > 0) return;
    setSaving(true);
    try {
      const updated = await checklistInventoryAutomationService.saveRules(templateId, rules);
      setRules(updated);
      setSavedRules(updated);
      toast.success('Regras de estoque salvas.');
    } catch {
      toast.error('Não foi possível salvar as regras. Revise os campos e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (!canView) return <ModuleStateView state="no-permission" />;
  if (loading) return <ModuleStateView state="loading" />;
  if (error) return <ModuleStateView state="error" errorMessage={error} />;

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-center gap-2">
          <Package className="size-5 text-indigo-600" />
          <h2 className="text-base font-semibold">Movimentação de estoque</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Relacione campos numéricos de “{templateName}” aos insumos movimentados quando a execução for concluída.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Automação deste checklist</p>
          <p className="text-sm text-muted-foreground">
            {enabled
              ? `${activeRules.length} regra${activeRules.length === 1 ? '' : 's'} ativa${activeRules.length === 1 ? '' : 's'}.`
              : 'Nenhuma regra ativa; concluir o checklist não movimentará estoque.'}
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={!canManage || rules.length === 0}
          onCheckedChange={checked => setRules(current => current.map(rule => ({ ...rule, active: checked })))}
        />
      </div>

      {numericFields.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <Package className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium">Nenhum campo numérico disponível</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione ao template um campo number, currency, quantity, integer ou decimal.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <p className="font-medium">Regras de consumo</p>
              <p className="text-xs text-muted-foreground">Somente campos numéricos aparecem para mapeamento.</p>
            </div>
            {canManage && (
              <Button type="button" variant="outline" onClick={addRule}>
                <Plus className="size-4" /> Adicionar mapeamento
              </Button>
            )}
          </div>

          {rules.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhuma regra configurada.
            </div>
          ) : (
            <div className="divide-y">
              {rules.map((rule, index) => {
                const valid = !invalidRules.includes(rule);
                return (
                  <div
                    key={ruleKey(rule, index)}
                    className={`grid gap-3 p-4 lg:grid-cols-[1.5fr_1.5fr_0.8fr_0.7fr_auto_auto] lg:items-start ${valid ? '' : 'border-l-4 border-l-amber-400 bg-amber-50/30'}`}
                  >
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Campo do checklist</label>
                      <select
                        className={inputClass}
                        value={rule.sourceFieldKey}
                        disabled={!canManage}
                        onChange={event => patchRule(index, { sourceFieldKey: event.target.value })}
                      >
                        <option value="">Selecione o campo</option>
                        {numericFields.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
                      </select>
                      {rule.sourceFieldKey && <code className="mt-1 block text-[11px] text-muted-foreground">{rule.sourceFieldKey}</code>}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Insumo</label>
                      <select
                        className={inputClass}
                        value={rule.inventoryItemId}
                        disabled={!canManage}
                        onChange={event => patchRule(index, { inventoryItemId: event.target.value })}
                      >
                        <option value="">Selecione o insumo</option>
                        {items.map(item => <option key={item.id} value={item.id}>{item.name} · {item.unitOfMeasure}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Movimento</label>
                      <select
                        className={`${inputClass} ${MOVEMENTS[rule.movementType].className}`}
                        value={rule.movementType}
                        disabled={!canManage}
                        onChange={event => patchRule(index, { movementType: event.target.value as InventoryAutomationMovementType })}
                      >
                        {(Object.entries(MOVEMENTS) as Array<[InventoryAutomationMovementType, { label: string }]>)
                          .map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        Multiplicador <Info className="size-3" />
                      </label>
                      <input
                        className={inputClass}
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={rule.multiplier}
                        disabled={!canManage}
                        onChange={event => patchRule(index, { multiplier: Number(event.target.value) })}
                      />
                    </div>

                    <div className="pt-6">
                      <Switch
                        checked={rule.active}
                        disabled={!canManage}
                        onCheckedChange={active => patchRule(index, { active })}
                      />
                    </div>

                    {canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-5 text-muted-foreground hover:text-red-600"
                        onClick={() => setRules(current => current.filter((_, ruleIndex) => ruleIndex !== index))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeRules.length > 0 && (
        <div className="rounded-xl border border-l-4 border-l-indigo-500 bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium text-indigo-700">
            <Eye className="size-4" /> Pré-visualização do impacto
          </div>
          <div className="grid gap-2 p-4">
            {activeRules.map((rule, index) => (
              <p key={ruleKey(rule, index)} className="text-sm text-muted-foreground">
                Se <strong className="text-foreground">{rule.fieldLabel}</strong> = 6, será gerada uma{' '}
                <strong className="text-foreground">{MOVEMENTS[rule.movementType].label.toLowerCase()}</strong> de{' '}
                <strong className="text-foreground">
                  6 × {rule.multiplier} = {Number((6 * rule.multiplier).toFixed(4))} {rule.inventoryItemUnit ?? ''} de {rule.inventoryItemName}
                </strong>.
              </p>
            ))}
            <div className="mt-2 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="size-4 shrink-0" />
              O checklist só será concluído se todas as movimentações configuradas forem aplicadas com sucesso.
            </div>
          </div>
        </div>
      )}

      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            {invalidRules.length > 0 ? (
              <span className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="size-4" /> {invalidRules.length} regra(s) incompleta(s)
              </span>
            ) : changed ? (
              <span className="text-muted-foreground">Há alterações ainda não salvas.</span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="size-4" /> Configuração sincronizada
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={!changed || saving} onClick={() => setRules(savedRules)}>
              Cancelar
            </Button>
            <Button type="button" disabled={saving || invalidRules.length > 0 || !changed} onClick={() => void save()}>
              <Save className="size-4" /> {saving ? 'Salvando...' : 'Salvar regras'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
