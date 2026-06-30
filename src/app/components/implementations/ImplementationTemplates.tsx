import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, CheckCircle2, Clock3, FileText, RefreshCw, Save, Settings2, Trash2 } from 'lucide-react';
import type { ImplementationTemplate } from '../../../types/implementation';
import { IMPLEMENTATION_PRIORITY_LABELS } from '../../../types/implementation';
import { implementationService } from '../../../services/implementationService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';

export function ImplementationTemplates() {
  const [templates, setTemplates] = useState<ImplementationTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<ImplementationTemplate | null>(null);
  const [activePhaseId, setActivePhaseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await implementationService.listTemplates();
      setTemplates(next);
      const selected = next.find(item => item.id === selectedId) ?? next[0] ?? null;
      setSelectedId(selected?.id ?? '');
      setDraft(selected ? JSON.parse(JSON.stringify(selected)) as ImplementationTemplate : null);
      setActivePhaseId(selected?.phases?.[0]?.id ?? '');
    } catch (loadError) {
      setError(implementationService.getErrorMessage(loadError, 'Nao foi possivel carregar os templates.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activePhase = useMemo(
    () => (draft?.phases ?? []).find(phase => phase.id === activePhaseId) ?? draft?.phases?.[0] ?? null,
    [activePhaseId, draft],
  );

  const selectTemplate = (template: ImplementationTemplate) => {
    setSelectedId(template.id);
    setDraft(JSON.parse(JSON.stringify(template)) as ImplementationTemplate);
    setActivePhaseId(template.phases?.[0]?.id ?? '');
    setSaved(false);
    setError(null);
  };

  const updateDraft = (patch: Partial<ImplementationTemplate>) => {
    setDraft(current => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await implementationService.saveTemplate(draft);
      setTemplates(current => current.map(item => (item.id === updated.id ? updated : item)));
      setDraft(updated);
      setSaved(true);
    } catch (saveError) {
      setError(implementationService.getErrorMessage(saveError, 'Nao foi possivel salvar o template.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft || !confirm(`Excluir template ${draft.name}?`)) return;

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await implementationService.deleteTemplate(draft.id);
      const next = templates.filter(item => item.id !== draft.id);
      setTemplates(next);
      const selected = next[0] ?? null;
      setSelectedId(selected?.id ?? '');
      setDraft(selected ? JSON.parse(JSON.stringify(selected)) as ImplementationTemplate : null);
      setActivePhaseId(selected?.phases?.[0]?.id ?? '');
    } catch (deleteError) {
      setError(implementationService.getErrorMessage(deleteError, 'Nao foi possivel excluir o template.'));
    } finally {
      setSaving(false);
    }
  };

  const updatePhase = (phaseId: string, patch: Record<string, unknown>) => {
    setDraft(current => current ? {
      ...current,
      phases: (current.phases ?? []).map(phase => phase.id === phaseId ? { ...phase, ...patch } : phase),
    } : current);
  };

  const updateTask = (phaseId: string, taskId: string, patch: Record<string, unknown>) => {
    setDraft(current => current ? {
      ...current,
      phases: (current.phases ?? []).map(phase => phase.id === phaseId
        ? {
            ...phase,
            tasks: (phase.tasks ?? []).map(task => task.id === taskId ? { ...task, ...patch } : task),
          }
        : phase),
    } : current);
  };

  return (
    <div className="space-y-6" data-testid="implementation-templates-page">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Templates de implantacao</h1>
          <p className="text-sm text-muted-foreground">Fases, SLAs, responsaveis sugeridos e dependencias do fluxo de abertura.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/implementations">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving || !draft}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar template
          </Button>
          <Button type="button" variant="outline" onClick={() => void remove()} disabled={saving || !draft}>
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {saved ? <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">Template salvo.</div> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-md border p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="size-4" />
            Templates
          </div>
          {loading ? <div className="text-sm text-muted-foreground">Carregando templates</div> : null}
          {!loading && (templates ?? []).length === 0 ? <div className="text-sm text-muted-foreground">Nenhum template encontrado.</div> : null}
          <div className="space-y-2" data-testid="implementation-template-list">
            {(templates ?? []).map(template => (
              <button
                key={template.id}
                type="button"
                className={`w-full rounded-md border p-3 text-left text-sm transition ${template.id === selectedId ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                onClick={() => selectTemplate(template)}
              >
                <div className="font-medium">{template.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{(template.phases ?? []).length} fases</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          {draft ? (
            <>
              <section className="rounded-md border p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                  <div className="grid gap-2">
                    <Label htmlFor="template-name">Nome</Label>
                    <Input id="template-name" value={draft.name} onChange={event => updateDraft({ name: event.target.value })} />
                  </div>
                  <div className="flex items-end gap-3">
                    <Switch checked={draft.active} onCheckedChange={checked => updateDraft({ active: checked })} />
                    <span className="pb-1 text-sm">{draft.active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <Label htmlFor="template-description">Descricao</Label>
                  <Textarea id="template-description" value={draft.description} onChange={event => updateDraft({ description: event.target.value })} />
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <div className="rounded-md border p-3">
                  <h2 className="mb-3 text-sm font-semibold">Fases</h2>
                  <div className="space-y-2">
                    {(draft.phases ?? []).map(phase => (
                      <button
                        key={phase.id}
                        type="button"
                        data-testid="implementation-template-phase"
                        className={`w-full rounded-md border p-3 text-left text-sm ${phase.id === activePhase?.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                        onClick={() => setActivePhaseId(phase.id)}
                      >
                        <div className="font-medium">{phase.order}. {phase.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{phase.slaDays} dia(s) de SLA</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  {activePhase ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
                        <div className="grid gap-2">
                          <Label>Fase</Label>
                          <Input value={activePhase.title} onChange={event => updatePhase(activePhase.id, { title: event.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Inicio relativo</Label>
                          <Input type="number" value={activePhase.relativeStartDay} onChange={event => updatePhase(activePhase.id, { relativeStartDay: Number(event.target.value) })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>SLA dias</Label>
                          <Input type="number" value={activePhase.slaDays} onChange={event => updatePhase(activePhase.id, { slaDays: Number(event.target.value) })} />
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <h3 className="text-sm font-semibold">Tarefas</h3>
                        {(activePhase.tasks ?? []).map(task => (
                          <div key={task.id} className="rounded-md border p-3" data-testid="implementation-template-task">
                            <div className="grid gap-3 md:grid-cols-[1fr_120px_180px]">
                              <div className="grid gap-2">
                                <Label>Titulo</Label>
                                <Input value={task.title} onChange={event => updateTask(activePhase.id, task.id, { title: event.target.value })} />
                              </div>
                              <div className="grid gap-2">
                                <Label>Dia relativo</Label>
                                <Input type="number" value={task.relativeDay} onChange={event => updateTask(activePhase.id, task.id, { relativeDay: Number(event.target.value) })} />
                              </div>
                              <div className="grid gap-2">
                                <Label>Responsavel sugerido</Label>
                                <Input value={task.suggestedAssignee} onChange={event => updateTask(activePhase.id, task.id, { suggestedAssignee: event.target.value })} />
                              </div>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px]">
                              <Textarea value={task.description} onChange={event => updateTask(activePhase.id, task.id, { description: event.target.value })} />
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2"><Clock3 className="size-4" />{IMPLEMENTATION_PRIORITY_LABELS[task.priority]}</div>
                                <div className="flex items-center gap-2"><FileText className="size-4" />{task.documentRequired ? 'Documento exigido' : 'Sem documento'}</div>
                                <div className="flex items-center gap-2"><CheckCircle2 className="size-4" />{task.trainingRequired ? 'Treinamento' : 'Sem treinamento'}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Selecione uma fase.</div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-md border p-6 text-sm text-muted-foreground">Nenhum template disponivel.</div>
          )}
        </main>
      </div>
    </div>
  );
}
