import { useMemo, useState } from 'react';
import { Archive, CheckCircle2, Copy, FileText, GitBranch, Plus, RefreshCw, Rocket, Save, Search, Settings2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import { onboardingProgramService } from '../../../services/onboardingProgramService';
import { useOnboardingPrograms } from '../../../shared/hooks/useOnboardingPrograms';
import type { OnboardingProgram, OnboardingProgramStep, OnboardingProgramVersion } from '../../../types/onboardingProgram';
import { ONBOARDING_PROGRAM_STATUS_LABELS, ONBOARDING_PROGRAM_VERSION_STATUS_LABELS } from '../../../types/onboardingProgram';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function statusClass(status: string) {
  if (status === 'published' || status === 'active') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700';
  if (status === 'archived') return 'border-muted bg-muted text-muted-foreground';
  return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
}

function emptyVersion(programId: string, version = 1): OnboardingProgramVersion {
  return {
    id: '',
    programId,
    version,
    status: 'draft',
    changeNotes: '',
    duplicatedFromVersionId: null,
    publishedAt: null,
    steps: [
      {
        ...onboardingProgramService.emptyStep(0),
        clientId: 'contract',
        name: 'Contrato',
        category: 'juridico',
        responsibleRole: 'consultor',
        sla: { days: 3, startsFrom: 'program_start', escalationPolicy: {} },
      },
    ],
    roleAssignments: [],
    createdAt: '',
    updatedAt: '',
  };
}

function normalizeDraftVersion(program: OnboardingProgram): OnboardingProgramVersion {
  return clone(program.versions.find(version => version.status === 'draft') ?? program.latestVersion ?? emptyVersion(program.id));
}

export function OnboardingProgramBuilder() {
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });
  const { programs, meta, loading, error, reload, setPrograms } = useOnboardingPrograms(filters);
  const [selectedId, setSelectedId] = useState('');
  const [draftProgram, setDraftProgram] = useState<OnboardingProgram | null>(null);
  const [draftVersion, setDraftVersion] = useState<OnboardingProgramVersion | null>(null);
  const [activeStepId, setActiveStepId] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedProgram = useMemo(
    () => programs.find(program => program.id === selectedId) ?? programs[0] ?? null,
    [programs, selectedId],
  );

  const selectProgram = (program: OnboardingProgram) => {
    const version = normalizeDraftVersion(program);
    setSelectedId(program.id);
    setDraftProgram(clone(program));
    setDraftVersion(version);
    setActiveStepId(version.steps[0]?.id ?? version.steps[0]?.clientId ?? '');
    setNotice(null);
    setActionError(null);
  };

  const effectiveProgram = draftProgram ?? selectedProgram;
  const effectiveVersion = draftVersion ?? (effectiveProgram ? normalizeDraftVersion(effectiveProgram) : null);
  const activeStep = effectiveVersion?.steps.find(step => step.id === activeStepId || step.clientId === activeStepId) ?? effectiveVersion?.steps[0] ?? null;
  const canEditVersion = effectiveVersion?.status !== 'published';

  const upsertProgramInList = (program: OnboardingProgram) => {
    setPrograms(current => {
      const exists = current.some(item => item.id === program.id);
      return exists ? current.map(item => (item.id === program.id ? program : item)) : [program, ...current];
    });
    selectProgram(program);
  };

  const createProgram = async () => {
    setSaving(true);
    setActionError(null);
    try {
      const program = await onboardingProgramService.create({
        name: 'Novo programa de onboarding',
        description: '',
        category: 'franquia',
      });
      const version = await onboardingProgramService.createVersion(program.id, emptyVersion(program.id));
      upsertProgramInList({ ...program, versions: [version], latestVersion: version, versionsCount: 1 });
      setNotice('Programa criado.');
    } catch (createError) {
      setActionError(onboardingProgramService.getErrorMessage(createError, 'Nao foi possivel criar o programa.'));
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!effectiveProgram || !effectiveVersion) return;
    setSaving(true);
    setNotice(null);
    setActionError(null);
    try {
      const program = await onboardingProgramService.update(effectiveProgram);
      const version = effectiveVersion.id
        ? await onboardingProgramService.updateVersion(program.id, effectiveVersion)
        : await onboardingProgramService.createVersion(program.id, effectiveVersion);
      upsertProgramInList({ ...program, versions: [version, ...program.versions.filter(item => item.id !== version.id)], latestVersion: version });
      setNotice('Programa salvo.');
    } catch (saveError) {
      setActionError(onboardingProgramService.getErrorMessage(saveError, 'Nao foi possivel salvar o programa.'));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!effectiveProgram || !effectiveVersion) return;
    setSaving(true);
    setActionError(null);
    try {
      const savedVersion = effectiveVersion.id ? effectiveVersion : await onboardingProgramService.createVersion(effectiveProgram.id, effectiveVersion);
      const version = await onboardingProgramService.publishVersion(effectiveProgram.id, savedVersion.id);
      const program = await onboardingProgramService.get(effectiveProgram.id);
      upsertProgramInList(program);
      setDraftVersion(version);
      setNotice('Versao publicada.');
    } catch (publishError) {
      setActionError(onboardingProgramService.getErrorMessage(publishError, 'Nao foi possivel publicar a versao.'));
    } finally {
      setSaving(false);
    }
  };

  const duplicateProgram = async () => {
    if (!effectiveProgram) return;
    setSaving(true);
    setActionError(null);
    try {
      const copy = await onboardingProgramService.duplicateProgram(effectiveProgram.id);
      upsertProgramInList(copy);
      setNotice('Programa duplicado.');
    } catch (duplicateError) {
      setActionError(onboardingProgramService.getErrorMessage(duplicateError, 'Nao foi possivel duplicar o programa.'));
    } finally {
      setSaving(false);
    }
  };

  const archiveProgram = async () => {
    if (!effectiveProgram || !window.confirm(`Arquivar ${effectiveProgram.name}?`)) return;
    setSaving(true);
    setActionError(null);
    try {
      const archived = await onboardingProgramService.archiveProgram(effectiveProgram.id);
      upsertProgramInList(archived);
      setNotice('Programa arquivado.');
    } catch (archiveError) {
      setActionError(onboardingProgramService.getErrorMessage(archiveError, 'Nao foi possivel arquivar o programa.'));
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    if (!effectiveVersion || !canEditVersion) return;
    const step = onboardingProgramService.emptyStep(effectiveVersion.steps.length);
    setDraftVersion({ ...effectiveVersion, steps: [...effectiveVersion.steps, step] });
    setActiveStepId(step.id);
  };

  const updateStep = (stepId: string, patch: Partial<OnboardingProgramStep>) => {
    if (!effectiveVersion || !canEditVersion) return;
    setDraftVersion({
      ...effectiveVersion,
      steps: effectiveVersion.steps.map(step => (step.id === stepId || step.clientId === stepId ? { ...step, ...patch } : step)),
    });
  };

  const removeStep = (stepId: string) => {
    if (!effectiveVersion || !canEditVersion || effectiveVersion.steps.length <= 1) return;
    const nextSteps = effectiveVersion.steps
      .filter(step => step.id !== stepId && step.clientId !== stepId)
      .map((step, index) => ({
        ...step,
        position: index + 1,
        dependencies: step.dependencies.filter(dependency => dependency !== stepId),
      }));
    setDraftVersion({ ...effectiveVersion, steps: nextSteps });
    setActiveStepId(nextSteps[0]?.id ?? '');
  };

  const toggleDependency = (step: OnboardingProgramStep, dependencyId: string) => {
    const next = step.dependencies.includes(dependencyId)
      ? step.dependencies.filter(item => item !== dependencyId)
      : [...step.dependencies, dependencyId];
    updateStep(step.id, { dependencies: next });
  };

  return (
    <div className="space-y-6" data-testid="onboarding-program-builder">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Programas de onboarding</h1>
          <p className="text-sm text-muted-foreground">Configure programas versionados que futuramente originam implementations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void reload()}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button type="button" onClick={() => void createProgram()} disabled={saving}>
            <Plus className="size-4" />
            Novo programa
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

      <section className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_160px_160px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="program-search"
            className="pl-9"
            placeholder="Buscar programa"
            value={filters.search}
            onChange={event => setFilters(current => ({ ...current, search: event.target.value }))}
          />
        </div>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}>
          <option value="">Todos status</option>
          <option value="draft">Rascunho</option>
          <option value="active">Ativo</option>
          <option value="archived">Arquivado</option>
        </select>
        <Input placeholder="Categoria" value={filters.category} onChange={event => setFilters(current => ({ ...current, category: event.target.value }))} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-md border p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Programas</span>
            <span className="text-xs text-muted-foreground">{meta?.total ?? programs.length}</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}
          {!loading && programs.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground" data-testid="program-empty-state">Nenhum programa encontrado.</div>
          ) : null}
          <div className="space-y-2" data-testid="program-list">
            {!loading && programs.map(program => (
              <button
                key={program.id}
                type="button"
                className={`w-full rounded-md border p-3 text-left text-sm transition ${effectiveProgram?.id === program.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                onClick={() => selectProgram(program)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{program.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(program.status)}`}>{ONBOARDING_PROGRAM_STATUS_LABELS[program.status]}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{program.versionsCount} versao(oes) · {program.category || 'sem categoria'}</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          {effectiveProgram && effectiveVersion ? (
            <>
              <section className="rounded-md border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid flex-1 gap-3 md:grid-cols-[1fr_180px]">
                    <div className="grid gap-2">
                      <Label htmlFor="program-name">Nome do programa</Label>
                      <Input id="program-name" data-testid="program-name-input" value={effectiveProgram.name} onChange={event => setDraftProgram({ ...effectiveProgram, name: event.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="program-category">Categoria</Label>
                      <Input id="program-category" value={effectiveProgram.category} onChange={event => setDraftProgram({ ...effectiveProgram, category: event.target.value })} />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="program-description">Descricao</Label>
                      <Textarea id="program-description" value={effectiveProgram.description} onChange={event => setDraftProgram({ ...effectiveProgram, description: event.target.value })} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button type="button" onClick={() => void save()} disabled={saving || !canEditVersion}>
                      {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Salvar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void publish()} disabled={saving || !canEditVersion}>
                      <Rocket className="size-4" />
                      Publicar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void duplicateProgram()} disabled={saving}>
                      <Copy className="size-4" />
                      Duplicar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void archiveProgram()} disabled={saving || effectiveProgram.status === 'archived'}>
                      <Archive className="size-4" />
                      Arquivar
                    </Button>
                  </div>
                </div>
              </section>

              <section className="rounded-md border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Versao {effectiveVersion.version}</h2>
                    <p className="text-sm text-muted-foreground">Versoes publicadas ficam imutaveis.</p>
                  </div>
                  <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${statusClass(effectiveVersion.status)}`}>
                    {ONBOARDING_PROGRAM_VERSION_STATUS_LABELS[effectiveVersion.status]}
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  <Label>Notas da versao</Label>
                  <Textarea value={effectiveVersion.changeNotes} disabled={!canEditVersion} onChange={event => setDraftVersion({ ...effectiveVersion, changeNotes: event.target.value })} />
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[300px_1fr]">
                <div className="rounded-md border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">Etapas</span>
                    <Button type="button" size="sm" variant="outline" onClick={addStep} disabled={!canEditVersion}>
                      <Plus className="size-4" />
                      Etapa
                    </Button>
                  </div>
                  <div className="space-y-2" data-testid="program-step-list">
                    {effectiveVersion.steps.map(step => (
                      <button
                        key={step.id}
                        type="button"
                        className={`w-full rounded-md border p-3 text-left text-sm ${activeStep?.id === step.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                        onClick={() => setActiveStepId(step.id)}
                      >
                        <div className="font-medium">{step.position}. {step.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{step.responsibleRole || 'sem responsavel'} · {step.sla.days} dia(s)</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  {activeStep ? (
                    <div className="space-y-4" data-testid="program-step-editor">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Settings2 className="size-4" />
                          Configuracao da etapa
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={() => removeStep(activeStep.id)} disabled={!canEditVersion || effectiveVersion.steps.length <= 1}>
                          <Trash2 className="size-4" />
                          Remover
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_110px_160px]">
                        <div className="grid gap-2">
                          <Label>Nome</Label>
                          <Input data-testid="program-step-name-input" value={activeStep.name} disabled={!canEditVersion} onChange={event => updateStep(activeStep.id, { name: event.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Ordem</Label>
                          <Input type="number" value={activeStep.position} disabled={!canEditVersion} onChange={event => updateStep(activeStep.id, { position: Number(event.target.value) })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Responsavel</Label>
                          <Input value={activeStep.responsibleRole} disabled={!canEditVersion} onChange={event => updateStep(activeStep.id, { responsibleRole: event.target.value })} />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                        <div className="grid gap-2">
                          <Label>Descricao</Label>
                          <Textarea value={activeStep.description} disabled={!canEditVersion} onChange={event => updateStep(activeStep.id, { description: event.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>SLA em dias</Label>
                          <Input type="number" value={activeStep.sla.days} disabled={!canEditVersion} onChange={event => updateStep(activeStep.id, { sla: { ...activeStep.sla, days: Number(event.target.value) } })} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Input value={activeStep.category} disabled={!canEditVersion} onChange={event => updateStep(activeStep.id, { category: event.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Dependencias</Label>
                        <div className="grid gap-2 md:grid-cols-2" data-testid="program-step-dependencies">
                          {effectiveVersion.steps.filter(step => step.id !== activeStep.id).map(step => (
                            <label key={step.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                              <input
                                type="checkbox"
                                disabled={!canEditVersion}
                                checked={activeStep.dependencies.includes(step.id)}
                                onChange={() => toggleDependency(activeStep, step.id)}
                              />
                              <GitBranch className="size-4" />
                              {step.name}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Criterios de conclusao</Label>
                        <Textarea
                          value={JSON.stringify(activeStep.completionCriteria)}
                          disabled={!canEditVersion}
                          onChange={event => updateStep(activeStep.id, { completionCriteria: event.target.value.trim() ? { text: event.target.value } : {} })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Documentos exigidos</Label>
                        <Textarea
                          value={activeStep.documentRequirements.map(item => String(item.name ?? '')).join('\n')}
                          disabled={!canEditVersion}
                          onChange={event => updateStep(activeStep.id, {
                            documentRequirements: event.target.value.split('\n').map(line => line.trim()).filter(Boolean).map(name => ({ name, required: true })),
                          })}
                          placeholder="Um documento por linha"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border p-6 text-sm text-muted-foreground">Selecione uma etapa.</div>
                  )}
                </div>
              </section>

              <section className="rounded-md border p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="size-4" />
                  Historico de versoes
                </div>
                <div className="space-y-2" data-testid="program-version-history">
                  {effectiveProgram.versions.map(version => (
                    <div key={version.id || version.version} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">Versao {version.version}</div>
                        <div className="text-sm text-muted-foreground">{version.changeNotes || 'Sem notas'}</div>
                      </div>
                      <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${statusClass(version.status)}`}>{ONBOARDING_PROGRAM_VERSION_STATUS_LABELS[version.status]}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-md border p-8 text-center" data-testid="program-builder-empty">
              <CheckCircle2 className="mx-auto mb-3 size-8 text-muted-foreground" />
              <h2 className="font-semibold">Nenhum programa selecionado</h2>
              <p className="mt-1 text-sm text-muted-foreground">Crie ou selecione um programa para configurar etapas, SLAs e dependencias.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
