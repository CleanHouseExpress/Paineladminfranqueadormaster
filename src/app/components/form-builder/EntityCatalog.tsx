import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Archive,
  BadgeCheck,
  Camera,
  ClipboardCheck,
  DollarSign,
  Edit,
  Eye,
  FileSignature,
  Library,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Timer,
  Wrench,
  Zap,
  Users,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { checklistManagementService } from '../../../services/checklistManagementService';
import type { ChecklistTemplate, ChecklistTemplateLibraryItem } from '../../../types/checklistManagement';

type CategoryKey = 'operacao' | 'qualidade' | 'estoque' | 'financeiro' | 'rh' | 'manutencao';
type FilterKey = 'automation' | 'stock' | 'signature' | 'attachments';

const categoryVisuals: Record<CategoryKey, { label: string; icon: typeof ClipboardCheck; tone: string }> = {
  operacao: { label: 'Operacao', icon: ClipboardCheck, tone: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  qualidade: { label: 'Qualidade', icon: ShieldCheck, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  estoque: { label: 'Estoque', icon: Package, tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  financeiro: { label: 'Financeiro', icon: DollarSign, tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  rh: { label: 'RH', icon: Users, tone: 'border-pink-200 bg-pink-50 text-pink-700' },
  manutencao: { label: 'Manutencao', icon: Wrench, tone: 'border-slate-200 bg-slate-50 text-slate-700' },
};

const categoryAliases: Array<[CategoryKey, string[]]> = [
  ['qualidade', ['qualidade', 'temperatura', 'auditoria', 'conformidade', 'limpeza']],
  ['estoque', ['estoque', 'descarte', 'recebimento', 'produto', 'inventario', 'cmv']],
  ['financeiro', ['financeiro', 'caixa', 'dre', 'royalty', 'pagamento']],
  ['rh', ['rh', 'treinamento', 'colaborador', 'equipe', 'funcionario']],
  ['manutencao', ['manutencao', 'equipamento', 'reparo', 'preventiva']],
  ['operacao', ['operacao', 'checklist', 'abertura', 'fechamento', 'rotina']],
];

const filterLabels: Record<FilterKey, { label: string; icon: typeof Zap }> = {
  automation: { label: 'Com automacao', icon: Zap },
  stock: { label: 'Com estoque', icon: Package },
  signature: { label: 'Com assinatura', icon: FileSignature },
  attachments: { label: 'Com anexos/fotos', icon: Camera },
};

function normalize(value: unknown) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function categoryKey(item: ChecklistTemplateLibraryItem | ChecklistTemplate): CategoryKey {
  const haystack = normalize(`${item.category ?? ''} ${item.name ?? ''} ${item.description ?? ''}`);
  return categoryAliases.find(([, words]) => words.some(word => haystack.includes(normalize(word))))?.[0] ?? 'operacao';
}

function tagsFor(item: ChecklistTemplateLibraryItem | ChecklistTemplate) {
  const text = normalize(`${item.name ?? ''} ${item.description ?? ''} ${item.category ?? ''}`);
  const tags = new Set<string>();

  if (text.includes('temperatura')) tags.add('temperatura');
  if (text.includes('estoque') || text.includes('produto') || text.includes('descarte') || text.includes('recebimento')) tags.add('estoque');
  if (text.includes('foto') || text.includes('anexo') || text.includes('evidencia')) tags.add('evidencias');
  if (text.includes('assinatura')) tags.add('assinatura');
  if (text.includes('auditoria') || text.includes('conformidade')) tags.add('auditoria');
  if ('automations_count' in item && Number(item.automations_count) > 0) tags.add('automacao');
  if (tags.size === 0) tags.add(categoryVisuals[categoryKey(item)].label.toLowerCase());

  return Array.from(tags).slice(0, 5);
}

function hasCapability(item: ChecklistTemplateLibraryItem, filter: FilterKey) {
  const text = normalize(`${item.name} ${item.description ?? ''} ${item.category} ${tagsFor(item).join(' ')}`);
  if (filter === 'automation') return Number(item.automations_count) > 0;
  if (filter === 'stock') return ['estoque', 'produto', 'descarte', 'recebimento', 'inventario', 'cmv'].some(word => text.includes(word));
  if (filter === 'signature') return text.includes('assinatura');
  return ['foto', 'anexo', 'evidencia', 'upload', 'imagem'].some(word => text.includes(word));
}

function estimatedMinutes(item: ChecklistTemplateLibraryItem) {
  const fields = Number(item.fields_count || 0);
  if (fields <= 6) return '3-5 min';
  if (fields <= 12) return '6-10 min';
  return '10-15 min';
}

function fieldCount(template: ChecklistTemplate) {
  return template.metadata?.form_schema?.length ?? 0;
}

function statusLabel(template: ChecklistTemplate) {
  const status = template.status ?? (template.active ? 'active' : 'draft');
  if (status === 'published') return 'Publicado';
  if (status === 'archived') return 'Arquivado';
  if (status === 'active') return 'Ativo';
  return 'Rascunho';
}

function statusTone(template: ChecklistTemplate) {
  const status = template.status ?? (template.active ? 'active' : 'draft');
  if (status === 'published') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'archived') return 'border-slate-200 bg-slate-100 text-slate-600';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function LibraryDetailsModal({
  item,
  importing,
  onClose,
  onUse,
}: {
  item: ChecklistTemplateLibraryItem;
  importing: boolean;
  onClose: () => void;
  onUse: (item: ChecklistTemplateLibraryItem) => void;
}) {
  const visual = categoryVisuals[categoryKey(item)];
  const Icon = visual.icon;
  const tags = tagsFor(item);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" data-testid="template-library-details">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-lg border bg-background shadow-xl">
        <div className="grid gap-6 border-b p-5 md:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`grid size-12 place-items-center rounded-md border ${visual.tone}`}>
                <Icon className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                    <BadgeCheck className="size-3" /> Oficial Orchestra
                  </span>
                  <span className={`rounded-full border px-2 py-1 text-xs font-medium ${visual.tone}`}>{visual.label}</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description ?? 'Template operacional pronto para personalizacao.'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Campos" value={item.fields_count} />
              <Metric label="Automacoes" value={item.automations_count} />
              <Metric label="Execucao" value={estimatedMinutes(item)} />
            </div>

            <div>
              <h3 className="text-sm font-semibold">Objetivo do template</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Padronizar a coleta de dados da rede, reduzir retrabalho operacional e permitir que tarefas, alertas e estoque sejam acionados a partir das respostas.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map(tag => <span key={tag} className="rounded-full border bg-muted/40 px-2 py-1 text-xs">{tag}</span>)}
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/20 p-4">
            <h3 className="font-semibold">Preview do franqueado</h3>
            <div className="mt-4 space-y-3">
              {Array.from({ length: Math.min(Math.max(item.fields_count, 3), 6) }).map((_, index) => (
                <div key={index} className="rounded-md border bg-background p-3">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="mt-2 h-9 rounded-md border bg-muted/30" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Preview ilustrativo derivado do total de campos informado pela API.</p>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <DetailList title="Campos incluidos" items={[`${item.fields_count} campos configurados`, 'Obrigatoriedade por campo', 'Tipos operacionais e validacoes']} />
          <DetailList title="Regras e automacoes" items={[`${item.automations_count} automacoes`, 'Condicoes por resposta', 'Acoes operacionais configuraveis']} />
          <DetailList title="Integracoes usadas" items={integrationsFor(item)} />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t p-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
          <Button type="button" onClick={() => onUse(item)} disabled={importing}>
            {importing ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Usar este template
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map(item => <li key={item} className="flex gap-2"><span className="mt-1 size-1.5 rounded-full bg-indigo-500" />{item}</li>)}
      </ul>
    </div>
  );
}

function integrationsFor(item: ChecklistTemplateLibraryItem) {
  const items = ['Metadata Engine'];
  if (hasCapability(item, 'automation')) items.push('Automation Engine');
  if (hasCapability(item, 'stock')) items.push('Inventory');
  if (hasCapability(item, 'attachments')) items.push('Documentos');
  return items;
}

export function EntityCatalog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [library, setLibrary] = useState<ChecklistTemplateLibraryItem[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    automation: false,
    stock: false,
    signature: false,
    attachments: false,
  });
  const [selected, setSelected] = useState<ChecklistTemplateLibraryItem | null>(null);
  const [importedTemplate, setImportedTemplate] = useState<ChecklistTemplate | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  async function loadTemplates() {
    setLoading(true);
    try {
      const payload = await checklistManagementService.listTemplates({ per_page: 100 });
      setTemplates(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  useEffect(() => {
    let active = true;
    setLibraryLoading(true);
    checklistManagementService.listTemplateLibrary(category ? { category } : {})
      .then(payload => { if (active) setLibrary(payload.data); })
      .finally(() => { if (active) setLibraryLoading(false); });
    return () => { active = false; };
  }, [category]);

  const categories = useMemo(() => Array.from(new Set(library.map(item => item.category))).sort(), [library]);

  const filteredLibrary = useMemo(() => {
    const term = normalize(search);
    const enabledFilters = Object.entries(filters).filter(([, enabled]) => enabled).map(([key]) => key as FilterKey);

    return library.filter(item => {
      const searchable = normalize(`${item.name} ${item.description ?? ''} ${item.category} ${tagsFor(item).join(' ')}`);
      if (term && !searchable.includes(term)) return false;
      return enabledFilters.every(filter => hasCapability(item, filter));
    });
  }, [filters, library, search]);

  async function importTemplate(item: ChecklistTemplateLibraryItem) {
    setImportingId(item.id);
    try {
      const template = await checklistManagementService.importTemplateLibraryItem(item.id);
      setImportedTemplate(template);
      setSelected(null);
      await loadTemplates();
    } finally {
      setImportingId(null);
    }
  }

  async function publishImported() {
    if (!importedTemplate) return;
    setPublishingId(importedTemplate.id);
    try {
      const template = await checklistManagementService.publishTemplate(importedTemplate.id);
      setImportedTemplate(template);
      await loadTemplates();
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Form Builder</h1>
          <p className="text-sm text-muted-foreground">Templates operacionais prontos para configurar, publicar e executar processos por franquia.</p>
        </div>
        <Button asChild><Link to="/settings/form-builder/new"><Plus className="size-4" />Novo template</Link></Button>
      </div>

      {importedTemplate ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                <BadgeCheck className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Template importado com sucesso.</h2>
                <p className="text-sm text-emerald-800">{importedTemplate.name} foi criado como rascunho editavel no seu tenant.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => navigate(`/settings/form-builder/${importedTemplate.id}`)}><Edit className="size-4" />Editar agora</Button>
              <Button type="button" variant="outline" onClick={() => void publishImported()} disabled={publishingId === importedTemplate.id}>
                {publishingId === importedTemplate.id ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Publicar
              </Button>
              <Button type="button" variant="outline" onClick={() => setImportedTemplate(null)}><Library className="size-4" />Voltar para biblioteca</Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Biblioteca de templates</h2>
            <p className="text-sm text-muted-foreground">Modelos oficiais importados como rascunhos editaveis, sem hardcode no frontend.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar por nome, categoria ou tags"
                aria-label="Buscar template"
              />
            </div>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filtrar categoria da biblioteca"
            >
              <option value="">Todas as categorias</option>
              {categories.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(filterLabels) as FilterKey[]).map(key => {
            const Icon = filterLabels[key].icon;
            const active = filters[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilters(current => ({ ...current, [key]: !current[key] }))}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors ${active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'bg-background text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="size-4" />
                {filterLabels[key].label}
              </button>
            );
          })}
        </div>

        {libraryLoading ? (
          <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
            <RefreshCw className="mx-auto mb-2 size-5 animate-spin" />Carregando biblioteca...
          </div>
        ) : filteredLibrary.length === 0 ? (
          <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
            <Library className="mx-auto mb-2 size-8 opacity-50" />Nenhum template oficial encontrado.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLibrary.map(item => {
              const visual = categoryVisuals[categoryKey(item)];
              const Icon = visual.icon;
              return (
                <article key={item.id} className="flex min-h-[280px] flex-col rounded-lg border bg-card p-4 shadow-sm" data-testid="template-library-card">
                  <div className="flex items-start gap-3">
                    <div className={`grid size-11 shrink-0 place-items-center rounded-md border ${visual.tone}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"><BadgeCheck className="size-3" />Oficial Orchestra</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${visual.tone}`}>{visual.label}</span>
                      </div>
                      <h3 className="mt-2 line-clamp-2 font-semibold tracking-normal">{item.name}</h3>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.description ?? 'Template operacional pronto para adaptar ao processo da rede.'}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tagsFor(item).map(tag => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"><Tag className="size-3" />{tag}</span>)}
                  </div>

                  <div className="mt-auto grid grid-cols-3 gap-2 pt-4 text-xs">
                    <Metric label="Campos" value={item.fields_count} />
                    <Metric label="Automacoes" value={item.automations_count} />
                    <Metric label="Tempo" value={estimatedMinutes(item)} />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={() => setSelected(item)}><Eye className="size-4" />Ver detalhes</Button>
                    <Button type="button" onClick={() => void importTemplate(item)} disabled={importingId === item.id}>
                      {importingId === item.id ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Usar template
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Templates do tenant</h2>
          <p className="text-sm text-muted-foreground">Modelos importados ou criados manualmente, prontos para edicao e publicacao.</p>
        </div>

        {loading ? (
          <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground"><RefreshCw className="mx-auto mb-2 size-5 animate-spin" />Carregando templates...</div>
        ) : templates.length === 0 ? (
          <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground"><ClipboardCheck className="mx-auto mb-2 size-8 opacity-50" />Nenhum template configurado.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {templates.map(template => {
              const visual = categoryVisuals[categoryKey(template)];
              const Icon = visual.icon;
              const count = fieldCount(template);
              return (
                <article key={template.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className={`grid size-10 place-items-center rounded-md border ${visual.tone}`}><Icon className="size-5" /></div>
                      <div>
                        <h3 className="font-semibold tracking-normal">{template.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description ?? 'Template criado manualmente ou importado da biblioteca.'}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${statusTone(template)}`}>{statusLabel(template)}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                    <Metric label="Origem" value={template.created_at ? 'Biblioteca/manual' : 'Manual'} />
                    <Metric label="Categoria" value={template.category ?? visual.label} />
                    <Metric label="Campos" value={count} />
                    <Metric label="Atualizado" value={formatDate(template.updated_at)} />
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline"><Link to={`/settings/form-builder/${template.id}`}><Edit className="size-4" />Editar</Link></Button>
                    {template.status !== 'published' ? (
                      <Button size="sm" variant="outline" onClick={async () => { await checklistManagementService.publishTemplate(template.id); await loadTemplates(); }}><Sparkles className="size-4" />Publicar</Button>
                    ) : null}
                    {template.status !== 'archived' ? (
                      <Button size="sm" variant="outline" onClick={async () => { await checklistManagementService.archiveTemplate(template.id); await loadTemplates(); }}><Archive className="size-4" />Arquivar</Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected ? (
        <LibraryDetailsModal
          item={selected}
          importing={importingId === selected.id}
          onClose={() => setSelected(null)}
          onUse={(item) => void importTemplate(item)}
        />
      ) : null}
    </div>
  );
}
