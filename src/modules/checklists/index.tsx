import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AlertTriangle, Archive, ArrowLeft, ClipboardCheck, Edit, Package, Play, Plus, RefreshCw, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';
import { Textarea } from '../../app/components/ui/textarea';
import { ChecklistInventoryConfig } from '../../app/components/checklists/ChecklistInventoryConfig';
import { DynamicFormRenderer } from '../../shared/components/DynamicFormRenderer';
import { usePermission } from '../../shared/hooks/usePermission';
import { ApiError } from '../../services/apiClient';
import { checklistInventoryAutomationService } from '../../services/checklistInventoryAutomationService';
import { checklistManagementService } from '../../services/checklistManagementService';
import { unitManagementService } from '../../services/unitManagementService';
import type { ChecklistExecution, ChecklistTemplate } from '../../types/checklistManagement';
import type { DynamicFieldSchema } from '../../types/userManagement';
import type { UnitOption } from '../../types/unitManagement';

type Answers = Record<string, unknown>;

function PageShell({ title, description, actions, children }: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const label = status === 'completed'
    ? 'Concluido'
    : status === 'in_progress'
      ? 'Em andamento'
      : status === 'active'
        ? 'Ativo'
        : status || 'Rascunho';

  return <span className="rounded-full border px-2 py-1 text-xs">{label}</span>;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function templateSchema(template?: ChecklistTemplate | null): DynamicFieldSchema[] {
  return template?.metadata?.form_schema ?? [];
}

function answersFromExecution(execution?: ChecklistExecution | null): Answers {
  const answers: Answers = {};
  (execution?.answers ?? []).forEach(answer => {
    const raw = answer.value as { value?: unknown };
    answers[answer.field_key] = raw && typeof raw === 'object' && 'value' in raw ? raw.value : answer.value;
  });
  return answers;
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== 'object') return fallback;
  const payload = error.data as { message?: string; errors?: Record<string, string[]> };
  const validationMessage = Object.values(payload.errors ?? {}).flat()[0];
  return validationMessage ?? payload.message ?? fallback;
}

export function ChecklistsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ executed_today: 0, pending: 0, completed: 0 });
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [metricsPayload, templatesPayload, executionsPayload] = await Promise.all([
        checklistManagementService.metrics(),
        checklistManagementService.listTemplates({ per_page: 5 }),
        checklistManagementService.listExecutions({ per_page: 5 }),
      ]);

      if (!cancelled) {
        setMetrics(metricsPayload);
        setTemplates(templatesPayload.data);
        setExecutions(executionsPayload.data);
        setLoading(false);
      }
    }

    void load().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      title="Checklists"
      description="Modelos, execucoes e acompanhamento operacional do tenant."
      actions={<Button asChild><Link to="/checklists/executions">Executar checklist</Link></Button>}
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Executados hoje', metrics.executed_today],
          ['Pendentes', metrics.pending],
          ['Concluidos', metrics.completed],
          ['Modelos ativos', templates.filter(template => template.active).length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{String(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border bg-card">
          <div className="border-b p-4 font-medium">Modelos recentes</div>
          <div className="divide-y">
            {loading ? <div className="p-4 text-sm text-muted-foreground">Carregando...</div> : null}
            {!loading && templates.length === 0 ? <div className="p-4 text-sm text-muted-foreground">Nenhum modelo criado.</div> : null}
            {templates.map(template => (
              <Link key={template.id} to={`/checklists/templates/${template.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <span>{template.name}</span>
                <StatusBadge status={template.active ? 'active' : 'inactive'} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <div className="border-b p-4 font-medium">Ultimas execucoes</div>
          <div className="divide-y">
            {executions.length === 0 ? <div className="p-4 text-sm text-muted-foreground">Nenhuma execucao registrada.</div> : null}
            {executions.map(execution => (
              <Link key={execution.id} to={`/checklists/executions/${execution.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{execution.template_name}</p>
                  <p className="text-xs text-muted-foreground">{execution.unit_name ?? 'Sem unidade'}</p>
                </div>
                <StatusBadge status={execution.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function ChecklistTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);

  async function load() {
    setLoading(true);
    const payload = await checklistManagementService.listTemplates({ per_page: 50 });
    setTemplates(payload.data);
    setLoading(false);
  }

  useEffect(() => {
    void load().catch(() => setLoading(false));
  }, []);

  async function remove(id: number) {
    await checklistManagementService.deleteTemplate(id);
    setTemplates(current => current.filter(template => template.id !== id));
  }

  return (
    <PageShell
      title="Modelos de checklist"
      description="Schemas dinamicos salvos no backend do tenant."
      actions={<Button asChild><Link to="/checklists/templates/new"><Plus className="size-4" />Novo modelo</Link></Button>}
    >
      <div className="overflow-hidden rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Campos</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-muted-foreground" colSpan={5}>Carregando...</td></tr> : null}
            {!loading && templates.length === 0 ? <tr><td className="p-4 text-muted-foreground" colSpan={5}>Nenhum modelo cadastrado.</td></tr> : null}
            {templates.map(template => (
              <tr key={template.id} className="border-t">
                <td className="p-3 font-medium">{template.name}</td>
                <td className="p-3">{template.category ?? '-'}</td>
                <td className="p-3">{templateSchema(template).length}</td>
                <td className="p-3"><StatusBadge status={template.active ? 'active' : 'inactive'} /></td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline"><Link to={`/checklists/templates/${template.id}`}><Edit className="size-4" />Editar</Link></Button>
                    <Button size="sm" variant="outline" onClick={() => void remove(template.id)}><Trash2 className="size-4" />Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

const FORM_FIELD_TYPES = ['text', 'textarea', 'number', 'quantity', 'currency', 'percentage', 'date', 'datetime', 'time', 'email', 'phone', 'document', 'boolean', 'select', 'multiselect', 'product', 'supplier', 'repeater', 'photo', 'signature', 'file'] as const;

function defaultField(order: number): DynamicFieldSchema {
  return {
    key: `campo_${order}`,
    label: `Campo ${order}`,
    type: 'text',
    field_type: 'text',
    required: false,
    visible: true,
    editable: true,
    order,
    section: 'geral',
  };
}

export function ChecklistTemplateFormPage() {
  const params = useParams();
  const id = params.id ?? params.entityId;
  const routeBase = params.entityId !== undefined ? '/settings/form-builder' : '/checklists/templates';
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('operacional');
  const [active, setActive] = useState(true);
  const [status, setStatus] = useState('draft');
  const [fields, setFields] = useState<DynamicFieldSchema[]>([defaultField(10)]);
  const [activeTab, setActiveTab] = useState<'configuration' | 'inventory'>('configuration');

  useEffect(() => {
    if (isNew) return;

    async function load() {
      setLoading(true);
      const template = await checklistManagementService.getTemplate(id as string);
      setName(template.name);
      setDescription(template.description ?? '');
      setCategory(template.category ?? 'operacional');
      setActive(template.active);
      setStatus(template.status ?? (template.active ? 'active' : 'inactive'));
      setFields(templateSchema(template));
      setLoading(false);
    }

    void load().catch(() => setLoading(false));
  }, [id, isNew]);

  function updateField(index: number, patch: Partial<DynamicFieldSchema>) {
    setFields(current => current.map((field, fieldIndex) => (
      fieldIndex === index ? { ...field, ...patch, field_type: patch.type ?? field.field_type } : field
    )));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        category,
        active,
        form_schema: fields.map((field, index) => ({
          ...field,
          order: field.order ?? (index + 1) * 10,
          field_type: field.field_type ?? field.type,
        })),
      };

      const template = isNew
        ? await checklistManagementService.createTemplate(payload)
        : await checklistManagementService.updateTemplate(id as string, payload);

      toast.success('Modelo salvo.');
      setStatus(template.status ?? status);
      navigate(`${routeBase}/${template.id}`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'NÃ£o foi possÃ­vel salvar o modelo.'));
    } finally {
      setSaving(false);
    }
  }

  async function publishTemplate() {
    if (isNew || !id) return;
    setSaving(true);
    try {
      const template = await checklistManagementService.publishTemplate(id);
      setActive(template.active);
      setStatus(template.status ?? 'published');
      toast.success('Modelo publicado.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Nao foi possivel publicar o modelo.'));
    } finally {
      setSaving(false);
    }
  }

  async function archiveTemplate() {
    if (isNew || !id) return;
    setSaving(true);
    try {
      const template = await checklistManagementService.archiveTemplate(id);
      setActive(template.active);
      setStatus(template.status ?? 'archived');
      toast.success('Modelo arquivado.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Nao foi possivel arquivar o modelo.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <EmptyState text="Carregando modelo..." />;

  const numericTypes = new Set(['number', 'currency', 'quantity', 'integer', 'decimal']);
  const numericFields = fields
    .filter(field => numericTypes.has(String(field.field_type ?? field.type)))
    .map(field => ({
      key: String(field.key),
      label: String(field.label),
      type: String(field.field_type ?? field.type),
    }));

  return (
    <PageShell
      title={isNew ? 'Novo modelo' : 'Editar modelo'}
      actions={
        <>
          {!isNew && <StatusBadge status={status} />}
          {!isNew && status !== 'published' && <Button disabled={saving} variant="outline" onClick={() => void publishTemplate()}><Send className="size-4" />Publicar</Button>}
          {!isNew && status !== 'archived' && <Button disabled={saving} variant="outline" onClick={() => void archiveTemplate()}><Archive className="size-4" />Arquivar</Button>}
          <Button asChild variant="outline"><Link to={routeBase}><ArrowLeft className="size-4" />Voltar</Link></Button>
        </>
      }
    >
      <div className="flex border-b">
        <button
          type="button"
          className={`border-b-2 px-4 py-3 text-sm font-medium ${activeTab === 'configuration' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('configuration')}
        >
          ConfiguraÃ§Ã£o
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package className="size-4" /> Estoque
          {numericFields.length > 0 && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{numericFields.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'configuration' ? (
        <form className="grid gap-6" onSubmit={event => void save(event)}>
          <div className="grid gap-4 rounded-md border bg-card p-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} required onChange={event => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" value={category} onChange={event => setCategory(event.target.value)} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea id="description" value={description} onChange={event => setDescription(event.target.value)} />
          </div>
          <label className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">Modelo ativo</span>
          </label>
          </div>

          <div className="grid gap-3 rounded-md border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Campos</h2>
            <Button type="button" variant="outline" onClick={() => setFields(current => [...current, defaultField((current.length + 1) * 10)])}>
              <Plus className="size-4" />Adicionar campo
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={`${field.key}-${index}`} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
              <Input value={field.key} placeholder="key" onChange={event => updateField(index, { key: event.target.value })} />
              <Input value={field.label} placeholder="Label" onChange={event => updateField(index, { label: event.target.value })} />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={field.type}
                onChange={event => {
                  const nextType = event.target.value;
                  const patch: Partial<DynamicFieldSchema> = { type: nextType as DynamicFieldSchema['type'], field_type: nextType };
                  if (nextType === 'product') patch.options_source = '/api/company/inventory/items/options';
                  if (nextType === 'supplier') patch.options_source = '/api/company/inventory/suppliers/options';
                  if (nextType === 'repeater' && !field.fields) patch.fields = [defaultField(10)];
                  updateField(index, patch);
                }}
              >
                {FORM_FIELD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Input value={field.section ?? ''} placeholder="Secao" onChange={event => updateField(index, { section: event.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(field.required)} onChange={event => updateField(index, { required: event.target.checked })} />
                Obrigatorio
              </label>
              <Input value={field.options_source ?? ''} placeholder="Fonte de opcoes" onChange={event => updateField(index, { options_source: event.target.value })} />
              <Input value={JSON.stringify(field.rules ?? {})} placeholder="Regras JSON" onChange={event => { try { updateField(index, { rules: JSON.parse(event.target.value || '{}') }); } catch { /* mantem ate o JSON ficar valido */ } }} />
              {field.type === 'repeater' && (
                <Textarea
                  className="md:col-span-5"
                  value={JSON.stringify(field.fields ?? [], null, 2)}
                  onChange={event => { try { updateField(index, { fields: JSON.parse(event.target.value || '[]') }); } catch { /* mantem ate o JSON ficar valido */ } }}
                />
              )}
            </div>
          ))}
          </div>

          <div className="flex justify-end">
            <Button disabled={saving} type="submit">
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar modelo
            </Button>
          </div>
        </form>
      ) : isNew ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <Package className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium">Salve o modelo primeiro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A configuraÃ§Ã£o de estoque fica disponÃ­vel depois que o template recebe um ID.
          </p>
        </div>
      ) : (
        <ChecklistInventoryConfig
          templateId={id as string}
          templateName={name}
          numericFields={numericFields}
        />
      )}
    </PageShell>
  );
}

export function ChecklistExecutionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [unitId, setUnitId] = useState('');

  async function load() {
    setLoading(true);
    const [templatesPayload, unitsPayload, executionsPayload] = await Promise.all([
      checklistManagementService.listTemplates({ active: true, per_page: 100 }),
      unitManagementService.getUnitOptions(),
      checklistManagementService.listExecutions({ per_page: 50 }),
    ]);
    setTemplates(templatesPayload.data);
    setUnits(unitsPayload);
    setExecutions(executionsPayload.data);
    setLoading(false);
  }

  useEffect(() => {
    void load().catch(() => setLoading(false));
  }, []);

  async function start() {
    if (!templateId || !unitId) return;
    const execution = await checklistManagementService.startExecution({
      template_id: Number(templateId),
      unit_id: Number(unitId),
    });
    navigate(`/checklists/executions/${execution.id}`);
  }

  return (
    <PageShell title="Execucoes de checklists" description="Inicie e acompanhe execucoes reais no backend.">
      <div className="grid gap-4 rounded-md border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={templateId} onChange={event => setTemplateId(event.target.value)}>
          <option value="">Selecione um modelo</option>
          {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={unitId} onChange={event => setUnitId(event.target.value)}>
          <option value="">Selecione uma unidade</option>
          {units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
        </select>
        <Button disabled={!templateId || !unitId} onClick={() => void start()}><Play className="size-4" />Iniciar</Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="p-3">Checklist</th>
              <th className="p-3">Unidade</th>
              <th className="p-3">Status</th>
              <th className="p-3">Inicio</th>
              <th className="p-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-muted-foreground" colSpan={5}>Carregando...</td></tr> : null}
            {!loading && executions.length === 0 ? <tr><td className="p-4 text-muted-foreground" colSpan={5}>Nenhuma execucao.</td></tr> : null}
            {executions.map(execution => (
              <tr key={execution.id} className="border-t">
                <td className="p-3 font-medium">{execution.template_name}</td>
                <td className="p-3">{execution.unit_name ?? '-'}</td>
                <td className="p-3"><StatusBadge status={execution.status} /></td>
                <td className="p-3">{formatDate(execution.started_at ?? execution.created_at)}</td>
                <td className="p-3 text-right">
                  <Button asChild size="sm" variant="outline"><Link to={`/checklists/executions/${execution.id}`}><ClipboardCheck className="size-4" />Abrir</Link></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export function ChecklistExecutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [execution, setExecution] = useState<ChecklistExecution | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [hasInventoryAutomation, setHasInventoryAutomation] = useState(false);
  const { hasPermission } = usePermission();
  const canViewInventoryAutomation = hasPermission('tenant.inventory.automation.view');

  const schema = useMemo(() => execution?.schema?.form_schema ?? [], [execution]);

  useEffect(() => {
    if (!id || id === 'new') {
      navigate('/checklists/executions');
      return;
    }

    async function load() {
      setLoading(true);
      const payload = await checklistManagementService.getExecution(id as string);
      setExecution(payload);
      setAnswers(answersFromExecution(payload));
      if (canViewInventoryAutomation) {
        const rules = await checklistInventoryAutomationService.getRules(payload.template_id).catch(() => []);
        setHasInventoryAutomation(rules.some(rule => rule.active));
      }
      setLoading(false);
    }

    void load().catch(() => setLoading(false));
  }, [canViewInventoryAutomation, id, navigate]);

  async function saveAnswers(complete = false) {
    if (!execution) return;
    setSaving(true);
    try {
      const payload = { answers };
      const updated = complete
        ? await checklistManagementService.completeExecution(execution.id, payload)
        : await checklistManagementService.updateExecution(execution.id, payload);
      setExecution(updated);
      setAnswers(answersFromExecution(updated));
      toast.success(complete ? 'Checklist concluÃ­do.' : 'Respostas salvas.');
    } catch (error) {
      toast.error(apiErrorMessage(
        error,
        complete
          ? 'NÃ£o foi possÃ­vel concluir. Verifique as respostas e o saldo de estoque.'
          : 'NÃ£o foi possÃ­vel salvar as respostas.',
      ));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <EmptyState text="Carregando execucao..." />;
  if (!execution) return <EmptyState text="Execucao nao encontrada." />;

  return (
    <PageShell
      title={execution.template_name ?? 'Execucao'}
      description={`${execution.unit_name ?? 'Sem unidade'} - ${formatDate(execution.started_at ?? execution.created_at)}`}
      actions={<Button asChild variant="outline"><Link to="/checklists/executions"><ArrowLeft className="size-4" />Voltar</Link></Button>}
    >
      {hasInventoryAutomation && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Package className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Este checklist gera movimentaÃ§Ãµes de estoque ao ser concluÃ­do.</p>
            <p className="text-xs text-amber-800">
              Se nÃ£o houver saldo suficiente, a conclusÃ£o serÃ¡ cancelada sem aplicar baixas parciais.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-card p-4">
        <DynamicFormRenderer
          schema={schema}
          values={answers}
          onChange={(key, nextValue) => setAnswers(current => ({ ...current, [key]: nextValue }))}
          readOnly={execution.status === 'completed'}
          showProgress
          highlightRequired
        />
      </div>

      {execution.status !== 'completed' && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={saving} onClick={() => void saveAnswers(false)}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar
          </Button>
          <Button disabled={saving} onClick={() => void saveAnswers(true)}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : hasInventoryAutomation ? <AlertTriangle className="size-4" /> : <ClipboardCheck className="size-4" />}
            Concluir
          </Button>
        </div>
      )}
    </PageShell>
  );
}
