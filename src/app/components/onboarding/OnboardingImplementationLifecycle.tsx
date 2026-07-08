import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Lightbulb, ListChecks, Plus, RefreshCw, Rocket, Search, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { onboardingImplementationService } from '../../../services/onboardingImplementationService';
import { onboardingProgramService } from '../../../services/onboardingProgramService';
import { useOnboardingImplementations } from '../../../shared/hooks/useOnboardingImplementations';
import type { OnboardingImplementation, OnboardingUnitOption } from '../../../types/onboardingImplementation';
import { ONBOARDING_IMPLEMENTATION_STATUS_LABELS } from '../../../types/onboardingImplementation';
import type { OnboardingProgram, OnboardingProgramVersion } from '../../../types/onboardingProgram';

function statusClass(status: string) {
  if (status === 'in_progress') return 'border-sky-500/40 bg-sky-500/10 text-sky-700';
  if (status === 'completed') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700';
  if (status === 'cancelled' || status === 'archived') return 'border-muted bg-muted text-muted-foreground';
  if (status === 'delayed') return 'border-destructive/40 bg-destructive/10 text-destructive';
  return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
}

function statusLabel(status: OnboardingImplementation['status']) {
  return ONBOARDING_IMPLEMENTATION_STATUS_LABELS[status] ?? status;
}

function stepStatusClass(status: string) {
  if (status === 'completed') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700';
  if (status === 'skipped') return 'border-muted bg-muted text-muted-foreground';
  return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
}

function stepStatusLabel(status: string) {
  if (status === 'completed') return 'Concluido';
  if (status === 'skipped') return 'Pulado';
  return 'Pendente';
}

function firstPublishedVersion(program: OnboardingProgram | null) {
  return program?.versions.find(version => version.status === 'published') ?? null;
}

export function OnboardingImplementationLifecycle() {
  const [filters, setFilters] = useState({ search: '', status: '', program_id: '', unit_id: '' });
  const { implementations, meta, loading, error, reload, setImplementations } = useOnboardingImplementations(filters);
  const [selectedId, setSelectedId] = useState('');
  const [programs, setPrograms] = useState<OnboardingProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [units, setUnits] = useState<OnboardingUnitOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [plannedOpeningDate, setPlannedOpeningDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedImplementation = useMemo(
    () => implementations.find(implementation => implementation.id === selectedId) ?? implementations[0] ?? null,
    [implementations, selectedId],
  );

  const selectedProgram = useMemo(
    () => programs.find(program => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const publishedVersions = useMemo(
    () => selectedProgram?.versions.filter(version => version.status === 'published') ?? [],
    [selectedProgram],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReferences() {
      setProgramsLoading(true);
      setActionError(null);
      try {
        const [programResult, unitOptions] = await Promise.all([
          onboardingProgramService.list({ status: 'active' }),
          onboardingImplementationService.unitOptions(),
        ]);
        if (cancelled) return;
        setPrograms(programResult.data);
        setUnits(unitOptions);
        const defaultProgram = programResult.data.find(program => program.publishedVersionsCount > 0) ?? programResult.data[0] ?? null;
        if (defaultProgram) {
          setSelectedProgramId(defaultProgram.id);
          const detailed = await onboardingProgramService.get(defaultProgram.id);
          if (cancelled) return;
          setPrograms(current => current.map(program => (program.id === detailed.id ? detailed : program)));
          setSelectedVersionId(firstPublishedVersion(detailed)?.id ?? '');
        }
        setSelectedUnitId(unitOptions[0]?.value ?? '');
      } catch (referenceError) {
        if (!cancelled) setActionError(onboardingImplementationService.getErrorMessage(referenceError, 'Nao foi possivel carregar programas e unidades.'));
      } finally {
        if (!cancelled) setProgramsLoading(false);
      }
    }

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const changeProgram = async (programId: string) => {
    setSelectedProgramId(programId);
    setSelectedVersionId('');
    setActionError(null);
    const current = programs.find(program => program.id === programId);
    if (firstPublishedVersion(current)) {
      setSelectedVersionId(firstPublishedVersion(current)?.id ?? '');
      return;
    }

    try {
      const detailed = await onboardingProgramService.get(programId);
      setPrograms(items => items.map(program => (program.id === detailed.id ? detailed : program)));
      setSelectedVersionId(firstPublishedVersion(detailed)?.id ?? '');
    } catch (programError) {
      setActionError(onboardingProgramService.getErrorMessage(programError, 'Nao foi possivel carregar as versoes do programa.'));
    }
  };

  const createImplementation = async () => {
    setSaving(true);
    setActionError(null);
    setNotice(null);
    try {
      const created = await onboardingImplementationService.create({
        unitId: selectedUnitId,
        programVersionId: selectedVersionId,
        plannedOpeningDate: plannedOpeningDate || null,
      });
      setImplementations(current => [created, ...current.filter(item => item.id !== created.id)]);
      setSelectedId(created.id);
      setCreateOpen(false);
      setNotice('Jornada criada.');
    } catch (createError) {
      setActionError(onboardingImplementationService.getErrorMessage(createError, 'Nao foi possivel criar a implementation.'));
    } finally {
      setSaving(false);
    }
  };

  const replaceImplementation = (updated: OnboardingImplementation) => {
    setImplementations(current => current.map(item => (item.id === updated.id ? updated : item)));
    setSelectedId(updated.id);
  };

  const startImplementation = async () => {
    if (!selectedImplementation) return;
    setSaving(true);
    setActionError(null);
    try {
      replaceImplementation(await onboardingImplementationService.start(selectedImplementation.id));
      setNotice('Implementation iniciada.');
    } catch (startError) {
      setActionError(onboardingImplementationService.getErrorMessage(startError, 'Nao foi possivel iniciar a implementation.'));
    } finally {
      setSaving(false);
    }
  };

  const cancelImplementation = async () => {
    if (!selectedImplementation || !window.confirm('Cancelar esta implementation?')) return;
    setSaving(true);
    setActionError(null);
    try {
      replaceImplementation(await onboardingImplementationService.cancel(selectedImplementation.id));
      setNotice('Implementation cancelada.');
    } catch (cancelError) {
      setActionError(onboardingImplementationService.getErrorMessage(cancelError, 'Nao foi possivel cancelar a implementation.'));
    } finally {
      setSaving(false);
    }
  };

  const completeStep = async (phaseId: string) => {
    if (!selectedImplementation) return;
    setSaving(true);
    setActionError(null);
    try {
      replaceImplementation(await onboardingImplementationService.completeStep(selectedImplementation.id, phaseId));
      setNotice('Passo concluido.');
    } catch (completeError) {
      setActionError(onboardingImplementationService.getErrorMessage(completeError, 'Nao foi possivel concluir o passo.'));
    } finally {
      setSaving(false);
    }
  };

  const skipStep = async (phaseId: string) => {
    if (!selectedImplementation) return;
    setSaving(true);
    setActionError(null);
    try {
      replaceImplementation(await onboardingImplementationService.skipStep(selectedImplementation.id, phaseId));
      setNotice('Passo pulado.');
    } catch (skipError) {
      setActionError(onboardingImplementationService.getErrorMessage(skipError, 'Nao foi possivel pular o passo.'));
    } finally {
      setSaving(false);
    }
  };

  const canCreate = selectedUnitId && selectedVersionId && !saving;
  const totalLabel = meta?.total ?? implementations.length;

  return (
    <div className="space-y-6" data-testid="onboarding-implementation-lifecycle">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Setup guiado</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o que falta configurar, o proximo passo e o caminho ate o primeiro valor.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void reload()}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)} disabled={programsLoading}>
            <Plus className="size-4" />
            Nova jornada
          </Button>
        </div>
      </div>

      {error || actionError ? (
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <span>{error ?? actionError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void reload()}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {notice ? <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{notice}</div> : null}

      <section className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_160px_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="implementation-search"
            className="pl-9"
            placeholder="Buscar por unidade ou programa"
            value={filters.search}
            onChange={event => setFilters(current => ({ ...current, search: event.target.value }))}
          />
        </div>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}>
          <option value="">Todos status</option>
          <option value="planning">Planejamento</option>
          <option value="in_progress">Em andamento</option>
          <option value="completed">Concluida</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filters.program_id} onChange={event => setFilters(current => ({ ...current, program_id: event.target.value }))}>
          <option value="">Todos programas</option>
          {programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filters.unit_id} onChange={event => setFilters(current => ({ ...current, unit_id: event.target.value }))}>
          <option value="">Todas unidades</option>
          {units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
        </select>
      </section>

      {createOpen ? (
        <section className="rounded-md border p-4" data-testid="implementation-create-panel">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold">Criar jornada guiada</h2>
              <p className="text-sm text-muted-foreground">Somente roteiros publicados podem iniciar uma jornada de onboarding.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              <XCircle className="size-4" />
              Fechar
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_1fr_170px]">
            <div className="grid gap-2">
              <Label>Programa</Label>
              <select data-testid="implementation-program-select" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedProgramId} onChange={event => void changeProgram(event.target.value)}>
                {programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Versao publicada</Label>
              <select data-testid="implementation-version-select" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedVersionId} onChange={event => setSelectedVersionId(event.target.value)}>
                {publishedVersions.length === 0 ? <option value="">Sem versoes</option> : null}
                {publishedVersions.map((version: OnboardingProgramVersion) => <option key={version.id} value={version.id}>v{version.version}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Unidade</Label>
              <select data-testid="implementation-unit-select" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedUnitId} onChange={event => setSelectedUnitId(event.target.value)}>
                {units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="implementation-planned-opening-date">Data prevista</Label>
              <Input id="implementation-planned-opening-date" type="date" value={plannedOpeningDate} onChange={event => setPlannedOpeningDate(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" data-testid="implementation-create-submit" onClick={() => void createImplementation()} disabled={!canCreate}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              Criar jornada
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-md border p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Jornadas</span>
            <span className="text-xs text-muted-foreground">{totalLabel}</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : null}
          {!loading && implementations.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground" data-testid="implementation-empty-state">Nenhuma implementation encontrada.</div>
          ) : null}
          <div className="space-y-2" data-testid="implementation-list">
            {!loading && implementations.map(implementation => (
              <button
                key={implementation.id}
                type="button"
                className={`w-full rounded-md border p-3 text-left text-sm transition ${selectedImplementation?.id === implementation.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                onClick={() => setSelectedId(implementation.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{implementation.unit?.name ?? 'Unidade'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{implementation.program?.name ?? 'Programa'} · v{implementation.programVersion?.version ?? 1}</div>
                  </div>
                  <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${statusClass(implementation.status)}`}>{statusLabel(implementation.status)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <ListChecks className="size-3.5" />
                  {implementation.stepsCount} passos · {implementation.guidedSetup?.summary.progressPercent ?? implementation.progressPercent}% pronto
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          {selectedImplementation ? (
            <>
              <section className="rounded-md border p-4" data-testid="implementation-detail">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedImplementation.unit?.name ?? 'Unidade'}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedImplementation.program?.name ?? 'Programa'} · versao {selectedImplementation.programVersion?.version ?? 1}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${statusClass(selectedImplementation.status)}`}>{statusLabel(selectedImplementation.status)}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => void startImplementation()} disabled={saving || !['planning', 'created', 'not_started'].includes(selectedImplementation.status)}>
                      <Rocket className="size-4" />
                      Iniciar
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void cancelImplementation()} disabled={saving || ['completed', 'cancelled', 'archived'].includes(selectedImplementation.status)}>
                      <XCircle className="size-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Progresso</div>
                    <div className="mt-1 text-lg font-semibold">{selectedImplementation.guidedSetup?.summary.progressPercent ?? selectedImplementation.progressPercent}%</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Passos</div>
                    <div className="mt-1 text-lg font-semibold">{selectedImplementation.stepsCount}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Proxima acao</div>
                    <div className="mt-1 text-sm font-medium">{selectedImplementation.guidedSetup?.nextAction?.title ?? 'Setup concluido'}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      Data prevista
                    </div>
                    <div className="mt-1 text-sm font-medium">{selectedImplementation.plannedOpeningDate ?? 'Sem data'}</div>
                  </div>
                </div>
              </section>

              {selectedImplementation.guidedSetup ? (
                <section className="rounded-md border p-4" data-testid="guided-setup-panel">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Lightbulb className="size-4" />
                        {selectedImplementation.guidedSetup.summary.title}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedImplementation.guidedSetup.summary.description}</p>
                    </div>
                    <div className="min-w-44">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{selectedImplementation.guidedSetup.summary.completedRequiredSteps}/{selectedImplementation.guidedSetup.summary.totalRequiredSteps} obrigatorios</span>
                        <span>{selectedImplementation.guidedSetup.summary.progressPercent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${selectedImplementation.guidedSetup.summary.progressPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  {selectedImplementation.guidedSetup.summary.firstValueReached ? (
                    <div className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm" data-testid="first-value-reached">
                      Primeiro valor atingido. A base inicial esta pronta para operar.
                    </div>
                  ) : null}

                  {selectedImplementation.guidedSetup.nextAction ? (
                    <div className="mt-4 rounded-md border p-4" data-testid="next-action-card">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-xs font-medium uppercase text-muted-foreground">Proximo passo</div>
                          <h3 className="mt-1 text-base font-semibold">{selectedImplementation.guidedSetup.nextAction.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{selectedImplementation.guidedSetup.nextAction.helpText || selectedImplementation.guidedSetup.nextAction.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" asChild>
                            <a href={selectedImplementation.guidedSetup.nextAction.moduleRoute}>
                              <ExternalLink className="size-4" />
                              {selectedImplementation.guidedSetup.nextAction.ctaLabel}
                            </a>
                          </Button>
                          <Button type="button" onClick={() => void completeStep(selectedImplementation.guidedSetup!.nextAction!.id)} disabled={saving || !selectedImplementation.guidedSetup.nextAction.canComplete}>
                            <CheckCircle2 className="size-4" />
                            Marcar pronto
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="rounded-md border p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4" />
                  Passos guiados
                </div>
                <div className="space-y-2" data-testid="implementation-phases">
                  {(selectedImplementation.guidedSetup?.steps ?? []).map(step => (
                    <div key={step.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[60px_1fr_150px_220px] md:items-center">
                      <div className="text-sm font-semibold">#{step.position}</div>
                      <div>
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm text-muted-foreground">{step.description || step.helpText}</div>
                      </div>
                      <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${stepStatusClass(step.status)}`}>{stepStatusLabel(step.status)}</span>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button type="button" size="sm" variant="outline" asChild>
                          <a href={step.moduleRoute}>
                            <ArrowRight className="size-4" />
                            Abrir
                          </a>
                        </Button>
                        <Button type="button" size="sm" onClick={() => void completeStep(step.id)} disabled={saving || !step.canComplete}>
                          Pronto
                        </Button>
                        {!step.isRequired ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => void skipStep(step.id)} disabled={saving || !step.canSkip}>
                            Pular
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-md border p-8 text-center" data-testid="implementation-detail-empty">
              <ListChecks className="mx-auto mb-3 size-8 text-muted-foreground" />
              <h2 className="font-semibold">Nenhuma jornada selecionada</h2>
              <p className="mt-1 text-sm text-muted-foreground">Crie uma jornada a partir de um roteiro publicado para iniciar o setup guiado.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
