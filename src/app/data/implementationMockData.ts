import type {
  ImplementationPhase,
  ImplementationTemplate,
  ImplementationTemplatePhase,
  ImplementationTask,
  ImplementationTaskStatus,
  UnitImplementation,
} from '../../types/implementation';

const DAY = 24 * 60 * 60 * 1000;
const BASE_DATE = new Date('2026-06-01T12:00:00.000Z');

function isoDate(offset: number) {
  return new Date(BASE_DATE.getTime() + offset * DAY).toISOString().slice(0, 10);
}

function phase(
  id: string,
  title: string,
  order: number,
  relativeStartDay: number,
  slaDays: number,
  tasks: ImplementationTemplatePhase['tasks'],
): ImplementationTemplatePhase {
  return { id, title, order, relativeStartDay, slaDays, tasks };
}

function task(
  id: string,
  title: string,
  relativeDay: number,
  suggestedAssignee: string,
  options: Partial<ImplementationTemplatePhase['tasks'][number]> = {},
) {
  return {
    id,
    title,
    relativeDay,
    suggestedAssignee,
    description: options.description ?? `Executar ${title.toLowerCase()} conforme padrao da rede.`,
    priority: options.priority ?? 'medium',
    dependencies: options.dependencies ?? [],
    documentRequired: options.documentRequired ?? false,
    trainingRequired: options.trainingRequired ?? false,
    checklist: options.checklist ?? ['Validar responsavel', 'Registrar evidencia'],
  } satisfies ImplementationTemplatePhase['tasks'][number];
}

export const defaultImplementationTemplate: ImplementationTemplate = {
  id: 'tpl-franchise-standard',
  name: 'Implantacao padrao de franquia',
  description: 'Fluxo base para abertura de unidade com documentos, obra, sistemas, equipe e inauguracao.',
  active: true,
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
  phases: [
    phase('contract', 'Contrato', 1, 0, 5, [
      task('contract-signature', 'Assinar contrato de franquia', 1, 'Expansao', { priority: 'high', documentRequired: true }),
      task('contract-fees', 'Confirmar taxas iniciais', 3, 'Financeiro', { priority: 'high' }),
      task('contract-kickoff', 'Realizar kickoff com franqueado', 5, 'Consultor de implantacao'),
    ]),
    phase('documents', 'Documentacao', 2, 6, 10, [
      task('docs-company', 'Validar documentos societarios', 8, 'Juridico', { documentRequired: true }),
      task('docs-licenses', 'Mapear licencas obrigatorias', 12, 'Consultor de implantacao', { documentRequired: true }),
      task('docs-bank', 'Cadastrar dados bancarios e fiscais', 15, 'Financeiro', { documentRequired: true }),
    ]),
    phase('project', 'Projeto', 3, 16, 15, [
      task('project-site', 'Aprovar ponto comercial', 18, 'Expansao', { priority: 'high' }),
      task('project-layout', 'Aprovar layout arquitetonico', 24, 'Arquitetura', { priority: 'high', dependencies: ['project-site'] }),
      task('project-budget', 'Fechar orcamento da obra', 29, 'Arquitetura', { dependencies: ['project-layout'] }),
    ]),
    phase('works', 'Obras', 4, 31, 30, [
      task('works-start', 'Iniciar obra civil', 33, 'Franqueado', { priority: 'high', dependencies: ['project-budget'] }),
      task('works-inspection', 'Realizar vistoria intermediaria', 45, 'Arquitetura', { priority: 'high' }),
      task('works-final', 'Aprovar vistoria final', 60, 'Arquitetura', { priority: 'critical', dependencies: ['works-inspection'] }),
    ]),
    phase('equipment', 'Equipamentos', 5, 54, 14, [
      task('equipment-order', 'Comprar equipamentos homologados', 56, 'Compras', { priority: 'high' }),
      task('equipment-delivery', 'Confirmar entrega de equipamentos', 64, 'Compras', { priority: 'high', dependencies: ['equipment-order'] }),
      task('equipment-install', 'Instalar e testar equipamentos', 68, 'Operacoes', { dependencies: ['equipment-delivery'] }),
    ]),
    phase('systems', 'Sistemas', 6, 62, 12, [
      task('systems-pos', 'Configurar PDV e retaguarda', 64, 'Tecnologia', { priority: 'high' }),
      task('systems-users', 'Criar usuarios e permissoes', 68, 'Tecnologia', { dependencies: ['systems-pos'] }),
      task('systems-integrations', 'Validar integracoes fiscais e delivery', 73, 'Tecnologia', { priority: 'high' }),
    ]),
    phase('marketing', 'Marketing', 7, 70, 12, [
      task('marketing-launch-plan', 'Aprovar plano de pre-inauguracao', 72, 'Marketing', { priority: 'high' }),
      task('marketing-assets', 'Liberar artes e enxoval local', 77, 'Marketing', { dependencies: ['marketing-launch-plan'] }),
      task('marketing-campaigns', 'Agendar campanhas de abertura', 82, 'Marketing', { dependencies: ['marketing-assets'] }),
    ]),
    phase('training', 'Treinamentos', 8, 78, 14, [
      task('training-manager', 'Treinar gestor da unidade', 80, 'Treinamento', { trainingRequired: true, priority: 'high' }),
      task('training-team', 'Treinar equipe operacional', 88, 'Treinamento', { trainingRequired: true, dependencies: ['training-manager'] }),
      task('training-simulation', 'Realizar operacao assistida', 92, 'Operacoes', { trainingRequired: true, priority: 'high' }),
    ]),
    phase('opening', 'Inauguracao', 9, 90, 8, [
      task('opening-checklist', 'Validar checklist final de abertura', 94, 'Consultor de implantacao', { priority: 'critical' }),
      task('opening-soft', 'Executar soft opening', 96, 'Operacoes', { dependencies: ['opening-checklist'] }),
      task('opening-official', 'Registrar inauguracao oficial', 98, 'Expansao', { priority: 'critical', dependencies: ['opening-soft'] }),
    ]),
  ],
};

function buildTasks(templatePhase: ImplementationTemplatePhase, statuses: Record<string, ImplementationTaskStatus>): ImplementationTask[] {
  return (templatePhase.tasks ?? []).map(templateTask => {
    const status = statuses[templateTask.id] ?? 'pending';
    const completedAt = status === 'completed' ? isoDate(templateTask.relativeDay + 1) : null;

    return {
      id: templateTask.id,
      phaseId: templatePhase.id,
      title: templateTask.title,
      description: templateTask.description,
      status,
      priority: templateTask.priority,
      assignee: templateTask.suggestedAssignee,
      dueDate: isoDate(templateTask.relativeDay),
      completedAt,
      checklist: (templateTask.checklist ?? []).map((item, index) => ({
        id: `${templateTask.id}-check-${index + 1}`,
        title: item,
        completed: status === 'completed',
      })),
      comments: [],
      history: status === 'completed'
        ? [{ id: `${templateTask.id}-history`, title: 'Tarefa concluida', createdAt: `${completedAt}T10:00:00.000Z` }]
        : [],
      files: templateTask.documentRequired ? [`${templateTask.title}.pdf`] : [],
      dependencies: templateTask.dependencies ?? [],
      documentRequired: templateTask.documentRequired,
      trainingRequired: templateTask.trainingRequired,
    };
  });
}

function phaseStatus(tasks: ImplementationTask[]): ImplementationTaskStatus {
  if ((tasks ?? []).some(item => item.status === 'blocked')) return 'blocked';
  if ((tasks ?? []).some(item => item.status === 'delayed')) return 'delayed';
  if ((tasks ?? []).length > 0 && tasks.every(item => item.status === 'completed')) return 'completed';
  if ((tasks ?? []).some(item => item.status === 'in_progress' || item.status === 'completed')) return 'in_progress';
  return 'pending';
}

function buildPhases(statuses: Record<string, ImplementationTaskStatus>): ImplementationPhase[] {
  return (defaultImplementationTemplate.phases ?? []).map(templatePhase => {
    const tasks = buildTasks(templatePhase, statuses);
    const status = phaseStatus(tasks);

    return {
      id: templatePhase.id,
      title: templatePhase.title,
      order: templatePhase.order,
      status,
      startedAt: status === 'pending' ? null : isoDate(templatePhase.relativeStartDay),
      completedAt: status === 'completed' ? isoDate(templatePhase.relativeStartDay + templatePhase.slaDays) : null,
      tasks,
    };
  });
}

function calculateProgress(phases: ImplementationPhase[]) {
  const tasks = (phases ?? []).flatMap(phaseItem => phaseItem.tasks ?? []);
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter(taskItem => taskItem.status === 'completed').length / tasks.length) * 100);
}

function currentPhaseId(phases: ImplementationPhase[]) {
  const lastPhase = phases.length > 0 ? phases[phases.length - 1] : null;
  return (phases ?? []).find(phaseItem => phaseItem.status !== 'completed')?.id ?? lastPhase?.id ?? 'contract';
}

function implementation(
  data: Omit<UnitImplementation, 'id' | 'templateId' | 'createdAt' | 'updatedAt' | 'currentPhaseId' | 'progress' | 'phases'>,
  statuses: Record<string, ImplementationTaskStatus>,
): UnitImplementation {
  const phases = buildPhases(statuses);

  return {
    ...data,
    id: `impl-${data.unitId}`,
    templateId: defaultImplementationTemplate.id,
    currentPhaseId: currentPhaseId(phases),
    progress: calculateProgress(phases),
    phases,
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
    history: [
      { id: `impl-${data.unitId}-start`, title: 'Implantacao iniciada', createdAt: '2026-06-01T09:00:00.000Z' },
    ],
  };
}

const completedUntilWorks = {
  'contract-signature': 'completed',
  'contract-fees': 'completed',
  'contract-kickoff': 'completed',
  'docs-company': 'completed',
  'docs-licenses': 'completed',
  'docs-bank': 'completed',
  'project-site': 'completed',
  'project-layout': 'completed',
  'project-budget': 'completed',
  'works-start': 'completed',
  'works-inspection': 'completed',
  'works-final': 'completed',
} satisfies Record<string, ImplementationTaskStatus>;

export const implementationTemplatesMock: ImplementationTemplate[] = [defaultImplementationTemplate];

export const implementationsMock: UnitImplementation[] = [
  implementation({
    unitId: 101,
    unitName: 'BH Savassi',
    city: 'Belo Horizonte',
    state: 'MG',
    brand: 'Bella Vita',
    status: 'in_progress',
    consultant: 'Marina Costa',
    expectedOpeningDate: isoDate(98),
  }, {
    ...completedUntilWorks,
    'equipment-order': 'completed',
    'equipment-delivery': 'in_progress',
    'systems-pos': 'completed',
    'systems-users': 'completed',
    'marketing-launch-plan': 'completed',
  }),
  implementation({
    unitId: 102,
    unitName: 'Goiania Bueno',
    city: 'Goiania',
    state: 'GO',
    brand: 'Bella Vita',
    status: 'in_progress',
    consultant: 'Rafael Nunes',
    expectedOpeningDate: isoDate(112),
  }, {
    'contract-signature': 'completed',
    'contract-fees': 'completed',
    'contract-kickoff': 'completed',
    'docs-company': 'completed',
    'docs-licenses': 'completed',
    'docs-bank': 'completed',
    'project-site': 'completed',
    'project-layout': 'in_progress',
    'project-budget': 'pending',
    'works-start': 'pending',
  }),
  implementation({
    unitId: 103,
    unitName: 'Recife Boa Viagem',
    city: 'Recife',
    state: 'PE',
    brand: 'Bella Vita',
    status: 'delayed',
    consultant: 'Bianca Torres',
    expectedOpeningDate: isoDate(80),
  }, {
    'contract-signature': 'completed',
    'contract-fees': 'completed',
    'contract-kickoff': 'completed',
    'docs-company': 'completed',
    'docs-licenses': 'delayed',
    'docs-bank': 'completed',
    'project-site': 'completed',
    'project-layout': 'blocked',
    'project-budget': 'delayed',
    'works-start': 'blocked',
  }),
];
