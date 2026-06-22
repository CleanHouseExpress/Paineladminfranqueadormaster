import type {
  CatalogItem,
  CatalogLabels,
  CatalogStats,
} from '../../types/catalog';
import { CATALOG_TYPE_CONFIG } from '../../types/catalog';

// ─── Labels ────────────────────────────────────────────────────────────────────
// Mock — in production would come from Metadata Engine API

export const mockCatalogLabels: CatalogLabels = {
  singular: 'Produto',
  plural: 'Produtos',
  newItem: 'Novo Produto',
  moduleTitle: 'Catálogo de Produtos',
};

// ─── Items ─────────────────────────────────────────────────────────────────────

export const mockCatalogItems: CatalogItem[] = [
  // ── 1: service / active ──────────────────────────────────────────────────────
  {
    id: 'cat-001',
    name: 'Consulta Inicial',
    description: 'Consulta inicial completa com avaliação detalhada e elaboração de plano de tratamento personalizado.',
    type: 'service',
    status: 'active',
    price: 250,
    sku: 'SRV-001',
    unit: 'sessão',
    typeFields: {
      duracaoMinutos: 60,
      exigeProfissional: true,
      exigeAgenda: true,
    },
    metadata: [
      { key: 'especialidade', label: 'Especialidade',     type: 'text',   value: 'Dermatologia' },
      { key: 'categoria',     label: 'Categoria Interna', type: 'text',   value: 'Consultas' },
      { key: 'observacoes',   label: 'Observações',       type: 'textarea', value: 'Incluir anamnese completa.' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-08T09:00:00.000Z',
    updatedAt: '2024-01-08T09:00:00.000Z',
  },
  // ── 2: service / active ──────────────────────────────────────────────────────
  {
    id: 'cat-002',
    name: 'Consulta Retorno',
    description: 'Consulta de retorno para acompanhamento de tratamento em andamento.',
    type: 'service',
    status: 'active',
    price: 150,
    sku: 'SRV-002',
    unit: 'sessão',
    typeFields: {
      duracaoMinutos: 30,
      exigeProfissional: true,
      exigeAgenda: true,
    },
    metadata: [
      { key: 'especialidade', label: 'Especialidade',     type: 'text', value: 'Dermatologia' },
      { key: 'categoria',     label: 'Categoria Interna', type: 'text', value: 'Consultas' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-08T10:00:00.000Z',
    updatedAt: '2024-01-08T10:00:00.000Z',
  },
  // ── 3: subscription / active ─────────────────────────────────────────────────
  {
    id: 'cat-003',
    name: 'Plano Premium Mensal',
    description: 'Assinatura mensal com acesso a todos os serviços premium da clínica, incluindo prioridade no agendamento.',
    type: 'subscription',
    status: 'active',
    price: 899,
    sku: 'SUB-001',
    unit: 'mês',
    typeFields: {
      cicloCobranca: 'mensal',
      intervaloRecorrencia: 1,
      periodoTeste: 15,
    },
    metadata: [
      { key: 'categoria',   label: 'Categoria Interna', type: 'text',   value: 'Planos e Assinaturas' },
      { key: 'nivel',       label: 'Nível',             type: 'select', value: 'Avançado' },
      { key: 'observacoes', label: 'Observações',       type: 'textarea', value: 'Inclui 15 dias de teste grátis.' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2024-01-10T09:00:00.000Z',
  },
  // ── 4: course / active ───────────────────────────────────────────────────────
  {
    id: 'cat-004',
    name: 'Curso Atendimento ao Cliente',
    description: 'Curso gratuito de boas práticas de atendimento ao cliente para colaboradores da rede.',
    type: 'course',
    status: 'active',
    price: 0,
    sku: 'CRS-001',
    unit: 'vaga',
    typeFields: {
      cargaHoraria: 8,
      certificadoDisponivel: true,
    },
    metadata: [
      { key: 'nivel',     label: 'Nível',             type: 'select', value: 'Básico' },
      { key: 'categoria', label: 'Categoria Interna', type: 'text',   value: 'Capacitação' },
      { key: 'tags',      label: 'Tags',              type: 'text',   value: 'atendimento, treinamento, gratuito' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-12T09:00:00.000Z',
    updatedAt: '2024-01-12T09:00:00.000Z',
  },
  // ── 5: custom / active ───────────────────────────────────────────────────────
  {
    id: 'cat-005',
    name: 'Kit Operacional Básico',
    description: 'Kit personalizado com itens essenciais para início de operação de uma unidade.',
    type: 'custom',
    status: 'active',
    price: 150,
    sku: 'KIT-001',
    unit: 'kit',
    typeFields: {},
    metadata: [
      { key: 'categoria',   label: 'Categoria Interna', type: 'text',     value: 'Kits e Combos' },
      { key: 'observacoes', label: 'Observações',       type: 'textarea', value: 'Conteúdo definido conforme necessidade da unidade.' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-15T09:00:00.000Z',
    updatedAt: '2024-01-15T09:00:00.000Z',
  },
  // ── 6: product / inactive ────────────────────────────────────────────────────
  {
    id: 'cat-006',
    name: 'Produto Teste A',
    description: 'Produto em fase de testes — temporariamente inativo até validação de estoque.',
    type: 'product',
    status: 'inactive',
    price: 45,
    sku: 'PRD-001',
    unit: 'un',
    typeFields: {
      controlaEstoque: true,
      estoqueMinimo: 10,
      custo: 22,
      codigoBarras: '7891234567890',
      pesoGramas: 250,
    },
    metadata: [
      { key: 'cor',       label: 'Cor',               type: 'text',   value: 'Branco' },
      { key: 'tamanho',   label: 'Tamanho',           type: 'select', value: 'M' },
      { key: 'categoria', label: 'Categoria Interna', type: 'text',   value: 'Produtos Físicos' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-18T09:00:00.000Z',
    updatedAt: '2024-01-20T14:00:00.000Z',
  },
  // ── 7: procedure / active ────────────────────────────────────────────────────
  {
    id: 'cat-007',
    name: 'Limpeza de Pele Profunda',
    description: 'Procedimento de limpeza de pele profunda com extração, esfoliação e hidratação final.',
    type: 'procedure',
    status: 'active',
    price: 180,
    sku: 'PRC-001',
    unit: 'sessão',
    typeFields: {
      duracaoMinutos: 45,
      exigeProfissional: true,
      equipamentoNecessario: 'Aparelho de alta frequência, vaporizador',
    },
    metadata: [
      { key: 'especialidade', label: 'Especialidade',     type: 'text',   value: 'Estética Facial' },
      { key: 'categoria',     label: 'Categoria Interna', type: 'text',   value: 'Procedimentos Faciais' },
      { key: 'nivel',         label: 'Nível',             type: 'select', value: 'Intermediário' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-20T09:00:00.000Z',
    updatedAt: '2024-01-20T09:00:00.000Z',
  },
  // ── 8: plan / active ─────────────────────────────────────────────────────────
  {
    id: 'cat-008',
    name: 'Plano Anual VIP',
    description: 'Plano anual com benefícios exclusivos VIP: acesso ilimitado a serviços, descontos e atendimento prioritário.',
    type: 'plan',
    status: 'active',
    price: 7200,
    sku: 'PLN-001',
    unit: 'ano',
    typeFields: {
      cicloCobranca: 'anual',
      validade: 12,
      itensIncluidos: ['Consultas ilimitadas', 'Procedimentos com 20% de desconto', 'Agendamento prioritário'],
    },
    metadata: [
      { key: 'categoria',   label: 'Categoria Interna', type: 'text',     value: 'Planos e Assinaturas' },
      { key: 'nivel',       label: 'Nível',             type: 'select',   value: 'Avançado' },
      { key: 'observacoes', label: 'Observações',       type: 'textarea', value: 'Pagamento anual à vista com 10% de desconto.' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-22T09:00:00.000Z',
    updatedAt: '2024-01-22T09:00:00.000Z',
  },
  // ── 9: service / active ──────────────────────────────────────────────────────
  {
    id: 'cat-009',
    name: 'Hidratação Corporal Premium',
    description: 'Tratamento de hidratação corporal profunda com produtos premium e massagem relaxante.',
    type: 'service',
    status: 'active',
    price: 120,
    sku: 'SRV-003',
    unit: 'sessão',
    typeFields: {
      duracaoMinutos: 60,
      exigeProfissional: true,
      exigeAgenda: false,
    },
    metadata: [
      { key: 'especialidade', label: 'Especialidade',     type: 'text',   value: 'Estética Corporal' },
      { key: 'categoria',     label: 'Categoria Interna', type: 'text',   value: 'Tratamentos Corporais' },
      { key: 'tags',          label: 'Tags',              type: 'text',   value: 'corporal, hidratação, relaxamento' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-25T09:00:00.000Z',
    updatedAt: '2024-01-25T09:00:00.000Z',
  },
  // ── 10: product / active ─────────────────────────────────────────────────────
  {
    id: 'cat-010',
    name: 'Crème Hidratante 100g',
    description: 'Creme hidratante de uso diário com fórmula enriquecida com ácido hialurônico e vitamina E.',
    type: 'product',
    status: 'active',
    price: 65,
    sku: 'PRD-002',
    unit: 'un',
    typeFields: {
      controlaEstoque: true,
      estoqueMinimo: 20,
      custo: 28,
      codigoBarras: '7899876543210',
      pesoGramas: 120,
    },
    metadata: [
      { key: 'especialidade', label: 'Especialidade',     type: 'text',   value: 'Dermocosméticos' },
      { key: 'categoria',     label: 'Categoria Interna', type: 'text',   value: 'Produtos de Revenda' },
      { key: 'tags',          label: 'Tags',              type: 'text',   value: 'hidratante, facial, revenda' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-28T09:00:00.000Z',
    updatedAt: '2024-01-28T09:00:00.000Z',
  },
  // ── 11: subscription / active ────────────────────────────────────────────────
  {
    id: 'cat-011',
    name: 'Assinatura Trimestral Plus',
    description: 'Assinatura trimestral com acesso a serviços Plus e benefícios exclusivos para assinantes.',
    type: 'subscription',
    status: 'active',
    price: 2400,
    sku: 'SUB-002',
    unit: 'trimestre',
    typeFields: {
      cicloCobranca: 'trimestral',
      intervaloRecorrencia: 3,
      periodoTeste: 7,
    },
    metadata: [
      { key: 'categoria',   label: 'Categoria Interna', type: 'text',     value: 'Planos e Assinaturas' },
      { key: 'nivel',       label: 'Nível',             type: 'select',   value: 'Intermediário' },
      { key: 'observacoes', label: 'Observações',       type: 'textarea', value: '7 dias de teste sem cobrança.' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-30T09:00:00.000Z',
    updatedAt: '2024-01-30T09:00:00.000Z',
  },
  // ── 12: course / archived ────────────────────────────────────────────────────
  {
    id: 'cat-012',
    name: 'Treinamento Avançado - Gestão',
    description: 'Curso avançado de gestão para líderes de unidades: finanças, pessoas, operações e estratégia.',
    type: 'course',
    status: 'archived',
    price: 500,
    sku: 'CRS-002',
    unit: 'vaga',
    typeFields: {
      cargaHoraria: 16,
      certificadoDisponivel: true,
    },
    metadata: [
      { key: 'nivel',       label: 'Nível',             type: 'select',   value: 'Avançado' },
      { key: 'categoria',   label: 'Categoria Interna', type: 'text',     value: 'Capacitação' },
      { key: 'observacoes', label: 'Observações',       type: 'textarea', value: 'Turma encerrada. Nova edição em breve.' },
    ],
    createdBy: 'Alexandre Rios',
    createdByAvatar: 'AR',
    createdAt: '2024-01-05T09:00:00.000Z',
    updatedAt: '2024-01-31T11:00:00.000Z',
  },
];

// ─── Stats ─────────────────────────────────────────────────────────────────────

const _recentItems = [...mockCatalogItems]
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 5);

// Count per type
function _countByType(type: string): number {
  return mockCatalogItems.filter(i => i.type === type).length;
}

const _allTypes = ['product', 'service', 'subscription', 'course', 'procedure', 'plan', 'custom'] as const;

const _avgPrice = Math.round(
  mockCatalogItems.reduce((sum, i) => sum + i.price, 0) / mockCatalogItems.length,
);

export const mockCatalogStats: CatalogStats = {
  total: 12,
  active: 9,
  inactive: 1,
  archived: 2,
  avgPrice: _avgPrice,
  byType: _allTypes
    .map(type => ({
      type,
      count: _countByType(type),
      label: CATALOG_TYPE_CONFIG[type].label,
      color: CATALOG_TYPE_CONFIG[type].color,
    }))
    .filter(entry => entry.count > 0),
  recentItems: _recentItems,
};
