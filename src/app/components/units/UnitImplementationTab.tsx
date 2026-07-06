import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, CircleAlert, ClipboardCheck, Download, FileClock, FileText, MessageSquare, RefreshCw, Save, Upload, UserRound } from 'lucide-react';
import type { Unit } from '../../../types/unitManagement';
import type { ImplementationTask, ImplementationTemplate, UnitImplementation } from '../../../types/implementation';
import {
  IMPLEMENTATION_PRIORITY_LABELS,
  IMPLEMENTATION_STATUS_LABELS,
  IMPLEMENTATION_TASK_STATUS_LABELS,
} from '../../../types/implementation';
import { implementationService } from '../../../services/implementationService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';

interface UnitImplementationTabProps {
  unit: Unit;
}

type InnerTab = 'tasks' | 'gantt' | 'history' | 'documents';

function daysBetween(date: string | null | undefined) {
  if (!date) return 0;
  const today = new Date();
  const target = new Date(`${date}T12:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function statusClass(status: string) {
  if (status === 'completed') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
  if (status === 'delayed' || status === 'blocked') return 'border-destructive/30 bg-destructive/10 text-destructive';
  if (status === 'in_progress') return 'border-blue-500/30 bg-blue-500/10 text-blue-700';
  return 'border-muted bg-muted/40 text-muted-foreground';
}

function priorityClass(priority: string) {
  if (priority === 'critical') return 'text-destructive';
  if (priority === 'high') return 'text-amber-700';
  return 'text-muted-foreground';
}

function formatDate(date: string | null | undefined) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentStatusLabel(status: string) {
  if (status === 'approved') return 'Aprovado';
  if (status === 'rejected') return 'Rejeitado';
  return 'Pendente de aprovacao';
}

function getImplementationUnitName(unit: Unit) {
  return unit.name || `Unidade ${unit.id}`;
}

function getDisplayUnitName(unit: Unit, implementation: UnitImplementation) {
  const genericName = `Unidade ${unit.id}`;
  if (implementation.unitName && implementation.unitName !== genericName) return implementation.unitName;
  return getImplementationUnitName(unit);
}

export function UnitImplementationTab({ unit }: UnitImplementationTabProps) {
  const [implementation, setImplementation] = useState<UnitImplementation | null>(null);
  const [templates, setTemplates] = useState<ImplementationTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InnerTab>('tasks');
  const [selectedTask, setSelectedTask] = useState<ImplementationTask | null>(null);
  const [comment, setComment] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextImplementation, nextTemplates] = await Promise.all([
        implementationService.getImplementationByUnit(unit.id),
        implementationService.listTemplates(),
      ]);
      setImplementation(nextImplementation);
      setTemplates(nextTemplates);
      setSelectedTemplateId(nextImplementation?.templateId ?? nextTemplates[0]?.id ?? '');
      setActivePhaseId(nextImplementation?.currentPhaseId ?? nextImplementation?.phases?.[0]?.id ?? null);
      setOpeningDate(nextImplementation?.actualOpeningDate ?? nextImplementation?.expectedOpeningDate ?? '');
    } catch (loadError) {
      setError(implementationService.getErrorMessage(loadError, 'Nao foi possivel carregar a implantacao da unidade.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [unit.id]);

  const phases = implementation?.phases ?? [];
  const activePhase = phases.find(phase => phase.id === activePhaseId) ?? phases[0] ?? null;
  const tasks = activePhase?.tasks ?? [];
  const allTasks = phases.flatMap(phase => phase.tasks ?? []);
  const completedTasks = allTasks.filter(task => task.status === 'completed').length;
  const criticalPending = allTasks.filter(task => task.priority === 'critical' && task.status !== 'completed').length;
  const documentsPending = allTasks.reduce((total, task) => total + (task.documents ?? []).filter(document => document.status === 'pending_approval').length, 0);
  const trainings = allTasks.filter(task => task.trainingRequired);
  const trainingsComplete = trainings.length === 0
    ? 0
    : Math.round((trainings.filter(task => task.status === 'completed').length / trainings.length) * 100);
  const remainingDays = daysBetween(implementation?.expectedOpeningDate);
  const delayedDays = remainingDays < 0 && implementation?.status !== 'completed' ? Math.abs(remainingDays) : 0;

  const currentAssignee = useMemo(() => {
    const inProgress = allTasks.find(task => task.status === 'in_progress');
    return inProgress?.assignee ?? activePhase?.tasks?.find(task => task.status !== 'completed')?.assignee ?? implementation?.consultant ?? '-';
  }, [activePhase?.tasks, allTasks, implementation?.consultant]);

  const startImplementation = async () => {
    if (!selectedTemplateId) {
      setError('Selecione um template para iniciar a implantacao.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await implementationService.createImplementation(unit.id, selectedTemplateId);
      const enriched = {
        ...created,
        unitName: getImplementationUnitName(unit),
        city: unit.address_city ?? created.city,
        state: unit.address_state ?? created.state,
      };
      setImplementation(enriched);
      setActivePhaseId(enriched.currentPhaseId);
    } catch (startError) {
      setError(implementationService.getErrorMessage(startError, 'Nao foi possivel iniciar a implantacao.'));
    } finally {
      setSaving(false);
    }
  };

  const completeTask = async (taskId: string) => {
    if (!implementation) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await implementationService.completeTask(implementation.id, taskId);
      setImplementation(updated);
      setSelectedTask(updated?.phases.flatMap(phase => phase.tasks ?? []).find(task => task.id === taskId) ?? null);
    } catch (completeError) {
      setError(implementationService.getErrorMessage(completeError, 'Nao foi possivel concluir a tarefa.'));
    } finally {
      setSaving(false);
    }
  };

  const refreshSelectedTask = (updated: UnitImplementation | null, taskId: string) => {
    setImplementation(updated);
    setSelectedTask(updated?.phases.flatMap(phase => phase.tasks ?? []).find(task => task.id === taskId) ?? null);
  };

  const uploadTaskDocument = async (taskId: string, file: File | null | undefined) => {
    if (!implementation || !file) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await implementationService.uploadTaskDocument(implementation.id, taskId, file);
      refreshSelectedTask(updated, taskId);
    } catch (uploadError) {
      setError(implementationService.getErrorMessage(uploadError, 'Nao foi possivel enviar o documento.'));
    } finally {
      setSaving(false);
    }
  };

  const approveTaskDocument = async (taskId: string, documentId: string) => {
    if (!implementation) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await implementationService.approveTaskDocument(implementation.id, taskId, documentId);
      refreshSelectedTask(updated, taskId);
    } catch (approveError) {
      setError(implementationService.getErrorMessage(approveError, 'Nao foi possivel aprovar o documento.'));
    } finally {
      setSaving(false);
    }
  };

  const downloadTaskDocument = async (taskId: string, documentId: string, filename: string) => {
    if (!implementation) return;
    setSaving(true);
    setError(null);
    try {
      await implementationService.downloadTaskDocument(implementation.id, taskId, documentId, filename);
    } catch (downloadError) {
      setError(implementationService.getErrorMessage(downloadError, 'Nao foi possivel baixar o documento.'));
    } finally {
      setSaving(false);
    }
  };

  const addComment = async () => {
    if (!implementation || !selectedTask || !comment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await implementationService.addTaskComment(implementation.id, selectedTask.id, comment.trim());
      setImplementation(updated);
      setSelectedTask(updated?.phases.flatMap(phase => phase.tasks ?? []).find(task => task.id === selectedTask.id) ?? null);
      setComment('');
    } catch (commentError) {
      setError(implementationService.getErrorMessage(commentError, 'Nao foi possivel adicionar o comentario.'));
    } finally {
      setSaving(false);
    }
  };

  const registerOpening = async () => {
    if (!implementation || !openingDate) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await implementationService.registerOpeningDate(implementation.id, openingDate);
      setImplementation(updated);
    } catch (openingError) {
      setError(implementationService.getErrorMessage(openingError, 'Nao foi possivel registrar a inauguracao.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-md border p-6 text-sm text-muted-foreground">Carregando implantacao</div>;
  }

  if (!implementation) {
    return (
      <div className="space-y-4 rounded-md border p-5" data-testid="implementation-empty-state">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Implantacao da unidade</h2>
          <p className="text-sm text-muted-foreground">Esta unidade ainda nao possui um fluxo de implantacao ativo.</p>
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
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selectedTemplateId}
            onChange={event => setSelectedTemplateId(event.target.value)}
          >
            {(templates ?? []).map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          <Button type="button" data-testid="implementation-start-button" disabled={saving || !selectedTemplateId} onClick={() => void startImplementation()}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
            Iniciar implantacao
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="implementation-tab">
      {error ? (
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <section className="rounded-md border p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-normal">{getDisplayUnitName(unit, implementation)}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(implementation.status)}`}>
                {IMPLEMENTATION_STATUS_LABELS[implementation.status]}
              </span>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <span className="inline-flex items-center gap-2"><UserRound className="size-4" />{implementation.consultant}</span>
              <span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />Prevista: {formatDate(implementation.expectedOpeningDate)}</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4" />Real: {formatDate(implementation.actualOpeningDate)}</span>
              <span>{implementation.city || unit.address_city || '-'} / {implementation.state || unit.address_state || '-'}</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Button type="button" variant="outline" disabled>
              Editar implantacao
            </Button>
            <Button type="button" variant="outline" disabled>
              Trocar template
            </Button>
            <Button type="button" onClick={() => void registerOpening()} disabled={saving || !openingDate}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Registrar inauguracao
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px] md:items-end">
          <div data-testid="implementation-progress">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Progresso geral</span>
              <strong>{implementation.progress}%</strong>
            </div>
            <Progress value={implementation.progress} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="opening-date">Data de inauguracao</Label>
            <Input id="opening-date" type="date" value={openingDate} onChange={event => setOpeningDate(event.target.value)} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        {[
          ['Dias restantes', delayedDays > 0 ? 0 : Math.max(0, remainingDays), CalendarDays],
          ['Dias atrasados', delayedDays, CircleAlert],
          ['Tarefas concluidas', `${completedTasks}/${allTasks.length}`, CheckCircle2],
          ['Criticas pendentes', criticalPending, CircleAlert],
          ['Docs pendentes', documentsPending, FileClock],
          ['Treinamentos', `${trainingsComplete}%`, ClipboardCheck],
          ['Progresso', `${implementation.progress}%`, ClipboardCheck],
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-md border p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">{label}</span>
              <Icon className="size-4" />
            </div>
            <div className="mt-2 text-xl font-semibold">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-md border p-3">
          <h3 className="mb-3 text-sm font-semibold">Fases</h3>
          <div className="space-y-2" data-testid="implementation-phase-list">
            {phases.map(phase => (
              <button
                key={phase.id}
                type="button"
                data-testid="implementation-phase-item"
                className={`w-full rounded-md border p-3 text-left text-sm transition ${phase.id === activePhase?.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setActivePhaseId(phase.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{phase.order}. {phase.title}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClass(phase.status)}`}>
                    {IMPLEMENTATION_TASK_STATUS_LABELS[phase.status]}
                  </span>
                </div>
                <Progress
                  className="mt-2 h-1.5"
                  value={(phase.tasks ?? []).length === 0 ? 0 : Math.round(((phase.tasks ?? []).filter(task => task.status === 'completed').length / (phase.tasks ?? []).length) * 100)}
                />
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-md border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-normal">{activePhase?.title ?? 'Fase'}</h3>
              <p className="text-sm text-muted-foreground">Responsavel atual: {currentAssignee}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['tasks', 'gantt', 'history', 'documents'] as InnerTab[]).map(tab => (
                <Button
                  key={tab}
                  type="button"
                  size="sm"
                  variant={activeTab === tab ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'tasks' ? 'Tarefas' : tab === 'gantt' ? 'Gantt' : tab === 'history' ? 'Historico' : 'Documentos'}
                </Button>
              ))}
            </div>
          </div>

          {activeTab === 'tasks' ? (
            <div className="mt-4 space-y-2" data-testid="implementation-task-list">
              {tasks.map(task => (
                <button
                  key={task.id}
                  type="button"
                  data-testid="implementation-task-item"
                  className="w-full rounded-md border p-3 text-left transition hover:bg-muted/40"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{task.description}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full border px-2 py-0.5 ${statusClass(task.status)}`}>{IMPLEMENTATION_TASK_STATUS_LABELS[task.status]}</span>
                      <span className={priorityClass(task.priority)}>{IMPLEMENTATION_PRIORITY_LABELS[task.priority]}</span>
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                </button>
              ))}
              {tasks.length === 0 ? <div className="rounded-md border p-4 text-sm text-muted-foreground">Nenhuma tarefa nesta fase.</div> : null}
            </div>
          ) : null}

          {activeTab === 'gantt' ? (
            <div className="mt-4 space-y-2">
              {allTasks.map(task => (
                <div key={task.id} className="grid gap-2 rounded-md border p-2 text-sm md:grid-cols-[220px_1fr_92px] md:items-center">
                  <span className="truncate">{task.title}</span>
                  <div className="h-3 rounded-full bg-muted">
                    <div
                      className={`h-3 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'blocked' || task.status === 'delayed' ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '55%' : '18%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === 'history' ? (
            <div className="mt-4 space-y-2">
              {(implementation.history ?? []).map(item => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-muted-foreground">{item.description ?? 'Sem detalhes'} - {new Date(item.createdAt).toLocaleString('pt-BR')}</div>
                </div>
              ))}
              {(implementation.history ?? []).length === 0 ? <div className="rounded-md border p-4 text-sm text-muted-foreground">Sem historico registrado.</div> : null}
            </div>
          ) : null}

          {activeTab === 'documents' ? (
            <div className="mt-4 space-y-2">
              {allTasks.filter(task => task.documentRequired || (task.documents ?? []).length > 0).map(task => (
                <div key={task.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <button type="button" className="text-left font-medium hover:underline" onClick={() => setSelectedTask(task)}>{task.title}</button>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(task.status)}`}>{IMPLEMENTATION_TASK_STATUS_LABELS[task.status]}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {(task.documents ?? []).length} documento(s), {(task.documents ?? []).filter(document => document.status === 'pending_approval').length} pendente(s)
                  </div>
                </div>
              ))}
              {allTasks.filter(task => task.documentRequired || (task.documents ?? []).length > 0).length === 0 ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">Nenhum documento vinculado as tarefas.</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {selectedTask ? (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <aside className="ml-auto h-full w-full max-w-xl overflow-auto border-l bg-background p-5 shadow-xl" data-testid="implementation-task-drawer" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-normal">{selectedTask.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setSelectedTask(null)}>Fechar</Button>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">Status</span><div>{IMPLEMENTATION_TASK_STATUS_LABELS[selectedTask.status]}</div></div>
              <div><span className="text-muted-foreground">Prioridade</span><div>{IMPLEMENTATION_PRIORITY_LABELS[selectedTask.priority]}</div></div>
              <div><span className="text-muted-foreground">Responsavel</span><div>{selectedTask.assignee}</div></div>
              <div><span className="text-muted-foreground">Prazo</span><div>{formatDate(selectedTask.dueDate)}</div></div>
            </div>

            <div className="mt-5 space-y-2">
              <h4 className="font-medium">Checklist</h4>
              {(selectedTask.checklist ?? []).map(item => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <CheckCircle2 className={`size-4 ${item.completed ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  {item.title}
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <h4 className="font-medium">Dependencias</h4>
              {(selectedTask.dependencies ?? []).length > 0 ? (
                (selectedTask.dependencies ?? []).map(item => <div key={item} className="rounded-md border p-2 text-sm">{item}</div>)
              ) : (
                <div className="text-sm text-muted-foreground">Sem dependencias.</div>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <h4 className="font-medium">Comentarios</h4>
              {(selectedTask.comments ?? []).map(item => (
                <div key={item.id} className="rounded-md border p-2 text-sm">
                  <div className="font-medium">{item.author}</div>
                  <div className="text-muted-foreground">{item.body}</div>
                </div>
              ))}
              <Textarea data-testid="implementation-comment-input" value={comment} onChange={event => setComment(event.target.value)} placeholder="Adicionar comentario interno" />
              <Button type="button" data-testid="implementation-comment-submit" variant="outline" onClick={() => void addComment()} disabled={saving || !comment.trim()}>
                <MessageSquare className="size-4" />
                Comentar
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium">Documentos</h4>
                <Button type="button" variant="outline" size="sm" disabled={saving} asChild>
                  <label>
                    <Upload className="size-4" />
                    Anexar
                    <input
                      type="file"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = '';
                        void uploadTaskDocument(selectedTask.id, file);
                      }}
                    />
                  </label>
                </Button>
              </div>
              {(selectedTask.documents ?? []).map(document => (
                <div key={document.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="size-4 shrink-0" />
                        <span className="truncate">{document.originalName}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatBytes(document.sizeBytes)} - {documentStatusLabel(document.status)}
                        {document.approvedAt ? ` - aprovado em ${new Date(document.approvedAt).toLocaleString('pt-BR')}` : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => void downloadTaskDocument(selectedTask.id, document.id, document.originalName)}>
                        <Download className="size-4" />
                      </Button>
                      {document.status === 'pending_approval' ? (
                        <Button type="button" size="sm" disabled={saving} onClick={() => void approveTaskDocument(selectedTask.id, document.id)}>
                          <CheckCircle2 className="size-4" />
                          Aprovar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {(selectedTask.documents ?? []).length === 0 ? (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">Nenhum documento anexado.</div>
              ) : null}
            </div>

            <div className="mt-5 space-y-2">
              <h4 className="font-medium">Historico da tarefa</h4>
              {(selectedTask.history ?? []).map(item => (
                <div key={item.id} className="rounded-md border p-2 text-sm">{item.title}</div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" data-testid="implementation-task-complete-button" disabled={saving || selectedTask.status === 'completed'} onClick={() => void completeTask(selectedTask.id)}>
                {saving ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Concluir tarefa
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
