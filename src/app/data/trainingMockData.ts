import type {
  Training,
  TrainingStats,
  TrainingAssignment,
  UserProgress,
} from '../../types/training';

// ─── Trainings ─────────────────────────────────────────────────────────────────

export const mockTrainings: Training[] = [
  // ── published / mandatory ─────────────────────────────────────────────────
  {
    id: 'trn-001',
    title: 'Boas Práticas de Atendimento ao Cliente',
    description: 'Técnicas e padrões de atendimento ao cliente para garantir a melhor experiência na rede.',
    category: 'atendimento',
    status: 'published',
    mandatory: true,
    durationMinutes: 45,
    documentId: 'tdoc-001',
    document: {
      id: 'tdoc-001',
      name: 'manual-atendimento.pdf',
      fileType: 'pdf',
      fileSize: 2202010,
      fileSizeFormatted: '2.1 MB',
      uploadedAt: '2024-01-10T09:00:00.000Z',
    },
    createdBy: 'Ana Rodrigues',
    createdByAvatar: 'AR',
    publishedAt: '2024-01-12T10:00:00.000Z',
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2024-01-12T10:00:00.000Z',
    assignedUsers: 8,
    assignedUnits: 8,
    completedUsers: 5,
    avgProgress: 67,
  },
  {
    id: 'trn-002',
    title: 'Manual Operacional da Unidade',
    description: 'Guia completo de operações padrão para franqueados e equipes das unidades.',
    category: 'operacional',
    status: 'published',
    mandatory: true,
    durationMinutes: 90,
    documentId: 'tdoc-002',
    document: {
      id: 'tdoc-002',
      name: 'manual-operacional.pdf',
      fileType: 'pdf',
      fileSize: 5662310,
      fileSizeFormatted: '5.4 MB',
      uploadedAt: '2024-01-20T14:00:00.000Z',
    },
    createdBy: 'Carlos Menezes',
    createdByAvatar: 'CM',
    publishedAt: '2024-01-22T08:00:00.000Z',
    createdAt: '2024-01-18T09:00:00.000Z',
    updatedAt: '2024-01-22T08:00:00.000Z',
    assignedUsers: 8,
    assignedUnits: 8,
    completedUsers: 6,
    avgProgress: 80,
  },
  {
    id: 'trn-003',
    title: 'Treinamento Financeiro Básico',
    description: 'Fundamentos de gestão financeira, fluxo de caixa e relatórios para unidades da rede.',
    category: 'financeiro',
    status: 'published',
    mandatory: false,
    durationMinutes: 60,
    createdBy: 'Pedro Nogueira',
    createdByAvatar: 'PN',
    publishedAt: '2024-02-05T10:00:00.000Z',
    createdAt: '2024-02-01T09:00:00.000Z',
    updatedAt: '2024-02-05T10:00:00.000Z',
    assignedUsers: 5,
    assignedUnits: 4,
    completedUsers: 2,
    avgProgress: 45,
  },
  {
    id: 'trn-004',
    title: 'Abertura e Fechamento de Loja',
    description: 'Procedimentos obrigatórios de abertura e fechamento diário das unidades.',
    category: 'operacional',
    status: 'published',
    mandatory: true,
    durationMinutes: 30,
    documentId: 'tdoc-004',
    document: {
      id: 'tdoc-004',
      name: 'procedimentos-abertura-fechamento.pdf',
      fileType: 'pdf',
      fileSize: 1048576,
      fileSizeFormatted: '1.0 MB',
      uploadedAt: '2024-02-10T11:00:00.000Z',
    },
    createdBy: 'Ana Rodrigues',
    createdByAvatar: 'AR',
    publishedAt: '2024-02-12T09:00:00.000Z',
    createdAt: '2024-02-08T09:00:00.000Z',
    updatedAt: '2024-02-12T09:00:00.000Z',
    assignedUsers: 8,
    assignedUnits: 8,
    completedUsers: 7,
    avgProgress: 92,
  },
  {
    id: 'trn-005',
    title: 'LGPD para Equipes',
    description: 'Treinamento sobre Lei Geral de Proteção de Dados e boas práticas de privacidade.',
    category: 'compliance',
    status: 'published',
    mandatory: true,
    durationMinutes: 40,
    createdBy: 'Carlos Menezes',
    createdByAvatar: 'CM',
    publishedAt: '2024-03-01T09:00:00.000Z',
    createdAt: '2024-02-25T09:00:00.000Z',
    updatedAt: '2024-03-01T09:00:00.000Z',
    assignedUsers: 8,
    assignedUnits: 8,
    completedUsers: 4,
    avgProgress: 55,
  },
  // ── published / optional ──────────────────────────────────────────────────
  {
    id: 'trn-006',
    title: 'Técnicas de Vendas e Conversão',
    description: 'Estratégias avançadas de vendas, técnicas de negociação e aumento de conversão.',
    category: 'comercial',
    status: 'published',
    mandatory: false,
    durationMinutes: 50,
    createdBy: 'Pedro Nogueira',
    createdByAvatar: 'PN',
    publishedAt: '2024-03-15T10:00:00.000Z',
    createdAt: '2024-03-10T09:00:00.000Z',
    updatedAt: '2024-03-15T10:00:00.000Z',
    assignedUsers: 4,
    assignedUnits: 3,
    completedUsers: 3,
    avgProgress: 70,
  },
  // ── draft ─────────────────────────────────────────────────────────────────
  {
    id: 'trn-007',
    title: 'Gestão de Conflitos e Liderança',
    description: 'Desenvolvimento de habilidades de liderança e resolução de conflitos no ambiente de trabalho.',
    category: 'lideranca',
    status: 'draft',
    mandatory: false,
    durationMinutes: 75,
    createdBy: 'Ana Rodrigues',
    createdByAvatar: 'AR',
    createdAt: '2024-04-01T09:00:00.000Z',
    updatedAt: '2024-04-05T14:00:00.000Z',
    assignedUsers: 0,
    assignedUnits: 0,
    completedUsers: 0,
    avgProgress: 0,
  },
  // ── published / mandatory ─────────────────────────────────────────────────
  {
    id: 'trn-008',
    title: 'Segurança Alimentar e Higiene',
    description: 'Normas e práticas de segurança alimentar, higiene pessoal e sanitização de ambientes.',
    category: 'seguranca',
    status: 'published',
    mandatory: true,
    durationMinutes: 35,
    createdBy: 'Carlos Menezes',
    createdByAvatar: 'CM',
    publishedAt: '2024-04-10T09:00:00.000Z',
    createdAt: '2024-04-05T09:00:00.000Z',
    updatedAt: '2024-04-10T09:00:00.000Z',
    assignedUsers: 8,
    assignedUnits: 8,
    completedUsers: 7,
    avgProgress: 88,
  },
  // ── draft ─────────────────────────────────────────────────────────────────
  {
    id: 'trn-009',
    title: 'Sistema de PDV - Treinamento Técnico',
    description: 'Operação completa do sistema de ponto de venda: cadastros, vendas, relatórios e suporte.',
    category: 'tecnico',
    status: 'draft',
    mandatory: false,
    durationMinutes: 120,
    createdBy: 'Pedro Nogueira',
    createdByAvatar: 'PN',
    createdAt: '2024-04-20T09:00:00.000Z',
    updatedAt: '2024-04-22T16:00:00.000Z',
    assignedUsers: 0,
    assignedUnits: 0,
    completedUsers: 0,
    avgProgress: 0,
  },
  // ── archived ──────────────────────────────────────────────────────────────
  {
    id: 'trn-010',
    title: 'Onboarding de Novos Franqueados',
    description: 'Programa completo de integração para franqueados recém-incorporados à rede.',
    category: 'operacional',
    status: 'archived',
    mandatory: false,
    durationMinutes: 180,
    createdBy: 'Ana Rodrigues',
    createdByAvatar: 'AR',
    publishedAt: '2023-06-01T09:00:00.000Z',
    createdAt: '2023-05-25T09:00:00.000Z',
    updatedAt: '2024-01-05T10:00:00.000Z',
    assignedUsers: 3,
    assignedUnits: 3,
    completedUsers: 3,
    avgProgress: 100,
  },
  // ── published / optional ──────────────────────────────────────────────────
  {
    id: 'trn-011',
    title: 'Marketing Digital para Unidades',
    description: 'Como usar redes sociais, Google Meu Negócio e campanhas digitais para atrair clientes.',
    category: 'comercial',
    status: 'published',
    mandatory: false,
    durationMinutes: 55,
    createdBy: 'Carlos Menezes',
    createdByAvatar: 'CM',
    publishedAt: '2024-05-02T09:00:00.000Z',
    createdAt: '2024-04-28T09:00:00.000Z',
    updatedAt: '2024-05-02T09:00:00.000Z',
    assignedUsers: 6,
    assignedUnits: 5,
    completedUsers: 2,
    avgProgress: 40,
  },
  // ── draft / mandatory ─────────────────────────────────────────────────────
  {
    id: 'trn-012',
    title: 'Compliance e Ética nos Negócios',
    description: 'Políticas de conformidade, código de ética e conduta esperada de toda a rede.',
    category: 'compliance',
    status: 'draft',
    mandatory: true,
    durationMinutes: 45,
    createdBy: 'Ana Rodrigues',
    createdByAvatar: 'AR',
    createdAt: '2024-05-10T09:00:00.000Z',
    updatedAt: '2024-05-15T14:00:00.000Z',
    assignedUsers: 0,
    assignedUnits: 0,
    completedUsers: 0,
    avgProgress: 0,
  },
];

// ─── Progress ──────────────────────────────────────────────────────────────────

export const mockTrainingProgress: Record<string, UserProgress[]> = {
  'trn-001': [
    { userId: 'usr-001', userName: 'Carlos Menezes', userAvatar: 'CM', unitName: 'Unidade Centro SP',        status: 'completed',   progressPercent: 100, completedAt: '2024-01-20T15:30:00.000Z', lastAccessedAt: '2024-01-20T15:30:00.000Z' },
    { userId: 'usr-002', userName: 'Ana Ferreira',   userAvatar: 'AF', unitName: 'Unidade Norte',            status: 'completed',   progressPercent: 100, completedAt: '2024-01-22T11:00:00.000Z', lastAccessedAt: '2024-01-22T11:00:00.000Z' },
    { userId: 'usr-003', userName: 'Roberto Lima',   userAvatar: 'RL', unitName: 'Clínica Premium Campinas', status: 'completed',   progressPercent: 100, completedAt: '2024-01-25T14:00:00.000Z', lastAccessedAt: '2024-01-25T14:00:00.000Z' },
    { userId: 'usr-004', userName: 'Patricia Souza', userAvatar: 'PS', unitName: 'Unidade Shopping Sul',     status: 'in_progress', progressPercent: 60,  lastAccessedAt: '2024-01-28T10:00:00.000Z' },
    { userId: 'usr-005', userName: 'Juliana Costa',  userAvatar: 'JC', unitName: 'Unidade Curitiba Centro',  status: 'in_progress', progressPercent: 40,  lastAccessedAt: '2024-01-30T09:00:00.000Z' },
    { userId: 'usr-006', userName: 'Fernando Alves', userAvatar: 'FA', unitName: 'Unidade BH Savassi',       status: 'completed',   progressPercent: 100, completedAt: '2024-02-01T16:00:00.000Z', lastAccessedAt: '2024-02-01T16:00:00.000Z' },
    { userId: 'usr-007', userName: 'Beatriz Santos', userAvatar: 'BS', unitName: 'Unidade RJ Ipanema',       status: 'not_started', progressPercent: 0 },
    { userId: 'usr-008', userName: 'Marcos Oliveira', userAvatar: 'MO', unitName: 'Unidade Porto Alegre',    status: 'completed',   progressPercent: 100, completedAt: '2024-02-03T13:00:00.000Z', lastAccessedAt: '2024-02-03T13:00:00.000Z' },
  ],
  'trn-002': [
    { userId: 'usr-001', userName: 'Carlos Menezes', userAvatar: 'CM', unitName: 'Unidade Centro SP',        status: 'completed',   progressPercent: 100, completedAt: '2024-02-05T14:00:00.000Z', lastAccessedAt: '2024-02-05T14:00:00.000Z' },
    { userId: 'usr-002', userName: 'Ana Ferreira',   userAvatar: 'AF', unitName: 'Unidade Norte',            status: 'completed',   progressPercent: 100, completedAt: '2024-02-07T10:00:00.000Z', lastAccessedAt: '2024-02-07T10:00:00.000Z' },
    { userId: 'usr-003', userName: 'Roberto Lima',   userAvatar: 'RL', unitName: 'Clínica Premium Campinas', status: 'in_progress', progressPercent: 75,  lastAccessedAt: '2024-02-10T11:00:00.000Z' },
    { userId: 'usr-004', userName: 'Patricia Souza', userAvatar: 'PS', unitName: 'Unidade Shopping Sul',     status: 'completed',   progressPercent: 100, completedAt: '2024-02-08T16:00:00.000Z', lastAccessedAt: '2024-02-08T16:00:00.000Z' },
    { userId: 'usr-005', userName: 'Juliana Costa',  userAvatar: 'JC', unitName: 'Unidade Curitiba Centro',  status: 'completed',   progressPercent: 100, completedAt: '2024-02-09T15:00:00.000Z', lastAccessedAt: '2024-02-09T15:00:00.000Z' },
    { userId: 'usr-006', userName: 'Fernando Alves', userAvatar: 'FA', unitName: 'Unidade BH Savassi',       status: 'in_progress', progressPercent: 50,  lastAccessedAt: '2024-02-12T09:00:00.000Z' },
    { userId: 'usr-007', userName: 'Beatriz Santos', userAvatar: 'BS', unitName: 'Unidade RJ Ipanema',       status: 'not_started', progressPercent: 0 },
    { userId: 'usr-008', userName: 'Marcos Oliveira', userAvatar: 'MO', unitName: 'Unidade Porto Alegre',   status: 'completed',   progressPercent: 100, completedAt: '2024-02-11T13:00:00.000Z', lastAccessedAt: '2024-02-11T13:00:00.000Z' },
  ],
  'trn-003': [
    { userId: 'usr-001', userName: 'Carlos Menezes', userAvatar: 'CM', unitName: 'Unidade Centro SP',        status: 'completed',   progressPercent: 100, completedAt: '2024-02-20T14:00:00.000Z', lastAccessedAt: '2024-02-20T14:00:00.000Z' },
    { userId: 'usr-003', userName: 'Roberto Lima',   userAvatar: 'RL', unitName: 'Clínica Premium Campinas', status: 'in_progress', progressPercent: 30,  lastAccessedAt: '2024-02-22T10:00:00.000Z' },
    { userId: 'usr-005', userName: 'Juliana Costa',  userAvatar: 'JC', unitName: 'Unidade Curitiba Centro',  status: 'not_started', progressPercent: 0 },
    { userId: 'usr-006', userName: 'Fernando Alves', userAvatar: 'FA', unitName: 'Unidade BH Savassi',       status: 'in_progress', progressPercent: 55,  lastAccessedAt: '2024-02-25T09:00:00.000Z' },
    { userId: 'usr-008', userName: 'Marcos Oliveira', userAvatar: 'MO', unitName: 'Unidade Porto Alegre',   status: 'completed',   progressPercent: 100, completedAt: '2024-02-28T16:00:00.000Z', lastAccessedAt: '2024-02-28T16:00:00.000Z' },
  ],
  'trn-004': [
    { userId: 'usr-001', userName: 'Carlos Menezes', userAvatar: 'CM', unitName: 'Unidade Centro SP',        status: 'completed',   progressPercent: 100, completedAt: '2024-02-15T10:00:00.000Z', lastAccessedAt: '2024-02-15T10:00:00.000Z' },
    { userId: 'usr-002', userName: 'Ana Ferreira',   userAvatar: 'AF', unitName: 'Unidade Norte',            status: 'completed',   progressPercent: 100, completedAt: '2024-02-16T11:00:00.000Z', lastAccessedAt: '2024-02-16T11:00:00.000Z' },
    { userId: 'usr-003', userName: 'Roberto Lima',   userAvatar: 'RL', unitName: 'Clínica Premium Campinas', status: 'completed',   progressPercent: 100, completedAt: '2024-02-17T14:00:00.000Z', lastAccessedAt: '2024-02-17T14:00:00.000Z' },
    { userId: 'usr-004', userName: 'Patricia Souza', userAvatar: 'PS', unitName: 'Unidade Shopping Sul',     status: 'completed',   progressPercent: 100, completedAt: '2024-02-18T09:00:00.000Z', lastAccessedAt: '2024-02-18T09:00:00.000Z' },
    { userId: 'usr-005', userName: 'Juliana Costa',  userAvatar: 'JC', unitName: 'Unidade Curitiba Centro',  status: 'completed',   progressPercent: 100, completedAt: '2024-02-18T15:00:00.000Z', lastAccessedAt: '2024-02-18T15:00:00.000Z' },
    { userId: 'usr-006', userName: 'Fernando Alves', userAvatar: 'FA', unitName: 'Unidade BH Savassi',       status: 'completed',   progressPercent: 100, completedAt: '2024-02-19T10:00:00.000Z', lastAccessedAt: '2024-02-19T10:00:00.000Z' },
    { userId: 'usr-007', userName: 'Beatriz Santos', userAvatar: 'BS', unitName: 'Unidade RJ Ipanema',       status: 'in_progress', progressPercent: 60,  lastAccessedAt: '2024-02-20T09:00:00.000Z' },
    { userId: 'usr-008', userName: 'Marcos Oliveira', userAvatar: 'MO', unitName: 'Unidade Porto Alegre',   status: 'completed',   progressPercent: 100, completedAt: '2024-02-19T16:00:00.000Z', lastAccessedAt: '2024-02-19T16:00:00.000Z' },
  ],
  'trn-005': [
    { userId: 'usr-001', userName: 'Carlos Menezes', userAvatar: 'CM', unitName: 'Unidade Centro SP',        status: 'completed',   progressPercent: 100, completedAt: '2024-03-10T14:00:00.000Z', lastAccessedAt: '2024-03-10T14:00:00.000Z' },
    { userId: 'usr-002', userName: 'Ana Ferreira',   userAvatar: 'AF', unitName: 'Unidade Norte',            status: 'in_progress', progressPercent: 70,  lastAccessedAt: '2024-03-12T10:00:00.000Z' },
    { userId: 'usr-003', userName: 'Roberto Lima',   userAvatar: 'RL', unitName: 'Clínica Premium Campinas', status: 'not_started', progressPercent: 0 },
    { userId: 'usr-004', userName: 'Patricia Souza', userAvatar: 'PS', unitName: 'Unidade Shopping Sul',     status: 'completed',   progressPercent: 100, completedAt: '2024-03-11T15:00:00.000Z', lastAccessedAt: '2024-03-11T15:00:00.000Z' },
    { userId: 'usr-005', userName: 'Juliana Costa',  userAvatar: 'JC', unitName: 'Unidade Curitiba Centro',  status: 'in_progress', progressPercent: 45,  lastAccessedAt: '2024-03-13T09:00:00.000Z' },
    { userId: 'usr-006', userName: 'Fernando Alves', userAvatar: 'FA', unitName: 'Unidade BH Savassi',       status: 'not_started', progressPercent: 0 },
    { userId: 'usr-007', userName: 'Beatriz Santos', userAvatar: 'BS', unitName: 'Unidade RJ Ipanema',       status: 'in_progress', progressPercent: 25,  lastAccessedAt: '2024-03-14T11:00:00.000Z' },
    { userId: 'usr-008', userName: 'Marcos Oliveira', userAvatar: 'MO', unitName: 'Unidade Porto Alegre',   status: 'completed',   progressPercent: 100, completedAt: '2024-03-12T16:00:00.000Z', lastAccessedAt: '2024-03-12T16:00:00.000Z' },
  ],
};

// ─── Assignments ───────────────────────────────────────────────────────────────

export const mockTrainingAssignments: TrainingAssignment[] = [
  // trn-001
  { id: 'asgn-001', trainingId: 'trn-001', type: 'unit', targetId: 'unit-001', targetName: 'Unidade Centro SP',        assignedAt: '2024-01-12T10:00:00.000Z', assignedBy: 'Ana Rodrigues' },
  { id: 'asgn-002', trainingId: 'trn-001', type: 'unit', targetId: 'unit-002', targetName: 'Unidade Norte',            assignedAt: '2024-01-12T10:00:00.000Z', assignedBy: 'Ana Rodrigues' },
  { id: 'asgn-003', trainingId: 'trn-001', type: 'unit', targetId: 'unit-003', targetName: 'Clínica Premium Campinas', assignedAt: '2024-01-12T10:00:00.000Z', assignedBy: 'Ana Rodrigues' },
  { id: 'asgn-004', trainingId: 'trn-001', type: 'user', targetId: 'usr-001',  targetName: 'Carlos Menezes',  targetAvatar: 'CM', assignedAt: '2024-01-12T10:30:00.000Z', assignedBy: 'Ana Rodrigues' },
  { id: 'asgn-005', trainingId: 'trn-001', type: 'user', targetId: 'usr-007',  targetName: 'Beatriz Santos',  targetAvatar: 'BS', assignedAt: '2024-01-12T10:30:00.000Z', assignedBy: 'Ana Rodrigues' },
  // trn-002
  { id: 'asgn-006', trainingId: 'trn-002', type: 'unit', targetId: 'unit-001', targetName: 'Unidade Centro SP',        assignedAt: '2024-01-22T08:00:00.000Z', assignedBy: 'Carlos Menezes' },
  { id: 'asgn-007', trainingId: 'trn-002', type: 'unit', targetId: 'unit-002', targetName: 'Unidade Norte',            assignedAt: '2024-01-22T08:00:00.000Z', assignedBy: 'Carlos Menezes' },
  { id: 'asgn-008', trainingId: 'trn-002', type: 'unit', targetId: 'unit-004', targetName: 'Unidade Shopping Sul',     assignedAt: '2024-01-22T08:00:00.000Z', assignedBy: 'Carlos Menezes' },
  { id: 'asgn-009', trainingId: 'trn-002', type: 'user', targetId: 'usr-006',  targetName: 'Fernando Alves',  targetAvatar: 'FA', assignedAt: '2024-01-22T08:30:00.000Z', assignedBy: 'Carlos Menezes' },
  // trn-003
  { id: 'asgn-010', trainingId: 'trn-003', type: 'unit', targetId: 'unit-001', targetName: 'Unidade Centro SP',        assignedAt: '2024-02-05T10:00:00.000Z', assignedBy: 'Pedro Nogueira' },
  { id: 'asgn-011', trainingId: 'trn-003', type: 'unit', targetId: 'unit-003', targetName: 'Clínica Premium Campinas', assignedAt: '2024-02-05T10:00:00.000Z', assignedBy: 'Pedro Nogueira' },
  { id: 'asgn-012', trainingId: 'trn-003', type: 'user', targetId: 'usr-008',  targetName: 'Marcos Oliveira', targetAvatar: 'MO', assignedAt: '2024-02-05T10:30:00.000Z', assignedBy: 'Pedro Nogueira' },
  // trn-004
  { id: 'asgn-013', trainingId: 'trn-004', type: 'unit', targetId: 'unit-001', targetName: 'Unidade Centro SP',        assignedAt: '2024-02-12T09:00:00.000Z', assignedBy: 'Ana Rodrigues' },
  { id: 'asgn-014', trainingId: 'trn-004', type: 'unit', targetId: 'unit-002', targetName: 'Unidade Norte',            assignedAt: '2024-02-12T09:00:00.000Z', assignedBy: 'Ana Rodrigues' },
  { id: 'asgn-015', trainingId: 'trn-004', type: 'unit', targetId: 'unit-005', targetName: 'Unidade Porto Alegre',     assignedAt: '2024-02-12T09:00:00.000Z', assignedBy: 'Ana Rodrigues' },
  { id: 'asgn-016', trainingId: 'trn-004', type: 'user', targetId: 'usr-007',  targetName: 'Beatriz Santos',  targetAvatar: 'BS', assignedAt: '2024-02-12T09:30:00.000Z', assignedBy: 'Ana Rodrigues' },
  // trn-005
  { id: 'asgn-017', trainingId: 'trn-005', type: 'unit', targetId: 'unit-001', targetName: 'Unidade Centro SP',        assignedAt: '2024-03-01T09:00:00.000Z', assignedBy: 'Carlos Menezes' },
  { id: 'asgn-018', trainingId: 'trn-005', type: 'unit', targetId: 'unit-002', targetName: 'Unidade Norte',            assignedAt: '2024-03-01T09:00:00.000Z', assignedBy: 'Carlos Menezes' },
  { id: 'asgn-019', trainingId: 'trn-005', type: 'unit', targetId: 'unit-006', targetName: 'Unidade Curitiba Centro',  assignedAt: '2024-03-01T09:00:00.000Z', assignedBy: 'Carlos Menezes' },
  { id: 'asgn-020', trainingId: 'trn-005', type: 'user', targetId: 'usr-002',  targetName: 'Ana Ferreira',    targetAvatar: 'AF', assignedAt: '2024-03-01T09:30:00.000Z', assignedBy: 'Carlos Menezes' },
  { id: 'asgn-021', trainingId: 'trn-005', type: 'user', targetId: 'usr-007',  targetName: 'Beatriz Santos',  targetAvatar: 'BS', assignedAt: '2024-03-01T09:30:00.000Z', assignedBy: 'Carlos Menezes' },
];

// ─── Stats ─────────────────────────────────────────────────────────────────────

const _recentTrainings = [...mockTrainings]
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 5);

const _mandatoryTrainings = mockTrainings.filter(t => t.mandatory);

const _topTrainings = [...mockTrainings]
  .filter(t => t.status === 'published')
  .sort((a, b) => b.completedUsers - a.completedUsers)
  .slice(0, 5);

export const mockTrainingStats: TrainingStats = {
  total: 12,
  published: 7,
  draft: 3,
  mandatory: 5,
  avgProgress: 68,
  recentTrainings: _recentTrainings,
  mandatoryTrainings: _mandatoryTrainings,
  topTrainings: _topTrainings,
};

// ─── Available users for assignment picker ─────────────────────────────────────

export const mockAvailableUsers = [
  { id: 'usr-001', name: 'Carlos Menezes',  avatar: 'CM', unit: 'Unidade Centro SP'        },
  { id: 'usr-002', name: 'Ana Ferreira',    avatar: 'AF', unit: 'Unidade Norte'            },
  { id: 'usr-003', name: 'Roberto Lima',    avatar: 'RL', unit: 'Clínica Premium Campinas' },
  { id: 'usr-004', name: 'Patricia Souza',  avatar: 'PS', unit: 'Unidade Shopping Sul'     },
  { id: 'usr-005', name: 'Juliana Costa',   avatar: 'JC', unit: 'Unidade Curitiba Centro'  },
  { id: 'usr-006', name: 'Fernando Alves',  avatar: 'FA', unit: 'Unidade BH Savassi'       },
  { id: 'usr-007', name: 'Beatriz Santos',  avatar: 'BS', unit: 'Unidade RJ Ipanema'       },
  { id: 'usr-008', name: 'Marcos Oliveira', avatar: 'MO', unit: 'Unidade Porto Alegre'     },
];

// ─── Available units for assignment picker ─────────────────────────────────────

export const mockAvailableUnits = [
  { id: 'unit-001', code: 'BV-001', name: 'Unidade Centro SP'        },
  { id: 'unit-002', code: 'BV-002', name: 'Unidade Norte'            },
  { id: 'unit-003', code: 'BV-003', name: 'Clínica Premium Campinas' },
  { id: 'unit-004', code: 'BV-004', name: 'Unidade Shopping Sul'     },
  { id: 'unit-005', code: 'BV-005', name: 'Unidade Porto Alegre'     },
  { id: 'unit-006', code: 'BV-006', name: 'Unidade Curitiba Centro'  },
  { id: 'unit-007', code: 'BV-007', name: 'Unidade BH Savassi'       },
  { id: 'unit-008', code: 'BV-008', name: 'Unidade RJ Ipanema'       },
];

// ─── Mock documents for picker ─────────────────────────────────────────────────

export const mockTrainingDocuments = [
  { id: 'tdoc-pick-001', name: 'manual-operacoes-2024.pdf',       size: '4.2 MB', type: 'pdf',  uploadedAt: '2024-05-10T09:00:00.000Z' },
  { id: 'tdoc-pick-002', name: 'slides-treinamento-inicial.pptx', size: '8.7 MB', type: 'pptx', uploadedAt: '2024-04-22T10:00:00.000Z' },
  { id: 'tdoc-pick-003', name: 'guia-rapido-pdv.pdf',             size: '1.1 MB', type: 'pdf',  uploadedAt: '2024-03-15T14:00:00.000Z' },
  { id: 'tdoc-pick-004', name: 'apresentacao-compliance.pptx',    size: '5.3 MB', type: 'pptx', uploadedAt: '2024-06-01T11:00:00.000Z' },
];
