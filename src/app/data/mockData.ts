export const mockTenant = {
  name: "Bella Vita Franchising",
  logo: "BV",
  domain: "bellavita.orchestra.app",
  primaryColor: "#6366F1",
  plan: "Enterprise",
};

export const mockModules = [
  { id: "units", name: "Gestão de Unidades", description: "Cadastro, monitoramento e controle de todas as unidades da rede em um único painel.", category: "Gestão da Rede", icon: "Building2", status: "active" as const, price: "Incluso" },
  { id: "clients", name: "Clientes & CRM", description: "Visão consolidada de clientes, histórico de interações e segmentação por unidade.", category: "Clientes e CRM", icon: "Users", status: "active" as const, price: "Incluso" },
  { id: "financial", name: "Financeiro Simplificado", description: "Visão gerencial de receitas, despesas e resultado da rede sem complexidade de ERP.", category: "Financeiro", icon: "DollarSign", status: "active" as const, price: "Incluso" },
  { id: "cashflow", name: "Fluxo de Caixa", description: "Acompanhamento de entradas e saídas em tempo real por unidade ou consolidado.", category: "Financeiro", icon: "TrendingUp", status: "active" as const, price: "Incluso" },
  { id: "dre", name: "DRE Gerencial", description: "Demonstração de resultado simplificada e visual para tomada de decisão rápida.", category: "Financeiro", icon: "BarChart3", status: "active" as const, price: "Incluso" },
  { id: "cmv", name: "CMV & Custos", description: "Controle de custo de mercadoria vendida e análise de margem por produto.", category: "Financeiro", icon: "Package", status: "active" as const, price: "Incluso" },
  { id: "royalties", name: "Royalties", description: "Cálculo, cobrança e controle de royalties e taxas de franquia por unidade.", category: "Financeiro", icon: "Receipt", status: "active" as const, price: "Incluso" },
  { id: "checklists", name: "Checklists Operacionais", description: "Criação e acompanhamento de checklists para padronização de processos na rede.", category: "Operação", icon: "ClipboardCheck", status: "active" as const, price: "Incluso" },
  { id: "pendencias", name: "Pendências & Tarefas", description: "Gestão de pendências críticas com atribuição, prazo e acompanhamento.", category: "Operação", icon: "AlertCircle", status: "active" as const, price: "Incluso" },
  { id: "diario", name: "Diário de Bordo", description: "Registro diário das operações de cada unidade com histórico e auditoria.", category: "Operação", icon: "BookOpen", status: "active" as const, price: "Incluso" },
  { id: "whatsapp", name: "Atendimento WhatsApp", description: "Central de atendimento multicanal via WhatsApp com distribuição por unidade.", category: "Atendimento", icon: "MessageCircle", status: "available" as const, price: "R$ 297/mês" },
  { id: "instagram", name: "Atendimento Instagram", description: "Gestão de mensagens e comentários do Instagram de todas as unidades.", category: "Atendimento", icon: "Instagram", status: "review" as const, price: "R$ 197/mês" },
  { id: "form-builder", name: "Form Builder", description: "Configure formularios, campos e templates operacionais sem escrever codigo.", category: "Configurações", icon: "LayoutTemplate", status: "active" as const, price: "Incluso" },
  { id: "agente-ia", name: "Agente IA", description: "Assistente inteligente para resposta automática, análise e sugestões operacionais.", category: "IA", icon: "Bot", status: "development" as const, price: "Em breve" },
  { id: "automacoes", name: "Automações", description: "Fluxos automatizados para notificações, cobranças e processos repetitivos.", category: "Automações", icon: "Zap", status: "available" as const, price: "R$ 197/mês" },
  { id: "relatorios", name: "Relatórios Avançados", description: "Relatórios customizados com exportação e agendamento automático.", category: "Relatórios", icon: "FileBarChart", status: "available" as const, price: "R$ 97/mês" },
  { id: "integracoes", name: "Integrações", description: "Conexão com ERPs, gateways de pagamento, plataformas de delivery e mais.", category: "Integrações", icon: "Plug", status: "available" as const, price: "Sob consulta" },
  { id: "nps", name: "NPS & Satisfação", description: "Pesquisas de satisfação automatizadas e acompanhamento de NPS por unidade.", category: "Clientes e CRM", icon: "Star", status: "development" as const, price: "Em breve" },
  { id: "supply", name: "Gestão de Insumos", description: "Controle de estoque, pedidos de reposição e centralização de compras.", category: "Operação", icon: "Boxes", status: "blocked" as const, price: "Sob consulta" },
];

export const mockUnits = [
  { id: 1, name: "Unidade Centro SP", code: "BV-001", city: "São Paulo", state: "SP", manager: "Carlos Menezes", status: "active", score: 94, clients: 342, revenue: 87400, since: "2021-03" },
  { id: 2, name: "Unidade Moema", code: "BV-002", city: "São Paulo", state: "SP", manager: "Ana Ferreira", status: "active", score: 88, clients: 289, revenue: 72100, since: "2021-08" },
  { id: 3, name: "Unidade Campinas", code: "BV-003", city: "Campinas", state: "SP", manager: "Roberto Lima", status: "active", score: 91, clients: 198, revenue: 54300, since: "2022-01" },
  { id: 4, name: "Unidade Santos", code: "BV-004", city: "Santos", state: "SP", manager: "Patricia Souza", status: "active", score: 76, clients: 145, revenue: 38900, since: "2022-06" },
  { id: 5, name: "Unidade Ribeirão Preto", code: "BV-005", city: "Ribeirão Preto", state: "SP", manager: "Marcos Oliveira", status: "active", score: 82, clients: 167, revenue: 43200, since: "2022-11" },
  { id: 6, name: "Unidade Curitiba Centro", code: "BV-006", city: "Curitiba", state: "PR", manager: "Juliana Costa", status: "active", score: 95, clients: 312, revenue: 91700, since: "2021-05" },
  { id: 7, name: "Unidade BH Savassi", code: "BV-007", city: "Belo Horizonte", state: "MG", manager: "Fernando Alves", status: "pending", score: 68, clients: 89, revenue: 22100, since: "2023-04" },
  { id: 8, name: "Unidade RJ Ipanema", code: "BV-008", city: "Rio de Janeiro", state: "RJ", manager: "Beatriz Santos", status: "active", score: 87, clients: 256, revenue: 67800, since: "2022-03" },
];

export const mockClients = [
  { id: 1, name: "Mariana Fonseca", email: "mariana@email.com", phone: "(11) 99834-2210", unit: "Unidade Centro SP", status: "active", since: "2022-03-14", lastVisit: "2024-01-08", totalSpent: 4820, visits: 28, tags: ["VIP", "Recorrente"], origin: "Indicação" },
  { id: 2, name: "Rafael Mendonça", email: "rafael@email.com", phone: "(11) 97654-3312", unit: "Unidade Moema", status: "active", since: "2023-07-02", lastVisit: "2024-01-05", totalSpent: 1940, visits: 9, tags: ["Novo"], origin: "Instagram" },
  { id: 3, name: "Carla Domingues", email: "carla@email.com", phone: "(19) 98765-0011", unit: "Unidade Campinas", status: "inactive", since: "2021-11-20", lastVisit: "2023-09-12", totalSpent: 7320, visits: 44, tags: ["Em risco"], origin: "Google" },
  { id: 4, name: "Pedro Henrique Costa", email: "pedro@email.com", phone: "(21) 99123-4456", unit: "Unidade RJ Ipanema", status: "active", since: "2022-08-18", lastVisit: "2024-01-09", totalSpent: 3610, visits: 19, tags: ["Recorrente"], origin: "Indicação" },
  { id: 5, name: "Fernanda Lima", email: "fernanda@email.com", phone: "(11) 98745-6677", unit: "Unidade Centro SP", status: "active", since: "2023-01-05", lastVisit: "2024-01-07", totalSpent: 2280, visits: 14, tags: ["VIP"], origin: "Site" },
  { id: 6, name: "Bruno Cavalcanti", email: "bruno@email.com", phone: "(41) 97856-7788", unit: "Unidade Curitiba Centro", status: "active", since: "2021-06-12", lastVisit: "2024-01-03", totalSpent: 9840, visits: 67, tags: ["VIP", "Recorrente", "Promotor"], origin: "Indicação" },
  { id: 7, name: "Tatiane Rocha", email: "tatiane@email.com", phone: "(11) 96543-2298", unit: "Unidade Moema", status: "active", since: "2023-05-29", lastVisit: "2023-12-28", totalSpent: 890, visits: 5, tags: ["Novo"], origin: "TikTok" },
  { id: 8, name: "Gustavo Freitas", email: "gustavo@email.com", phone: "(31) 98234-5509", unit: "Unidade BH Savassi", status: "active", since: "2023-06-10", lastVisit: "2024-01-01", totalSpent: 1340, visits: 7, tags: ["Recorrente"], origin: "Instagram" },
];

export const mockUsers = [
  { id: 1, name: "Alexandre Rios", email: "alexandre@bellavita.com.br", role: "Franqueador Master", unit: "Rede completa", status: "active", lastAccess: "2024-01-09", avatar: "AR" },
  { id: 2, name: "Priscila Nunes", email: "priscila@bellavita.com.br", role: "Admin Financeiro", unit: "Rede completa", status: "active", lastAccess: "2024-01-09", avatar: "PN" },
  { id: 3, name: "Carlos Menezes", email: "carlos@bv001.com.br", role: "Gestor de Unidade", unit: "Unidade Centro SP", status: "active", lastAccess: "2024-01-08", avatar: "CM" },
  { id: 4, name: "Ana Ferreira", email: "ana@bv002.com.br", role: "Gestor de Unidade", unit: "Unidade Moema", status: "active", lastAccess: "2024-01-07", avatar: "AF" },
  { id: 5, name: "Thiago Barbosa", email: "thiago@bellavita.com.br", role: "Admin Operacional", unit: "Rede completa", status: "active", lastAccess: "2024-01-06", avatar: "TB" },
  { id: 6, name: "Juliana Costa", email: "juliana@bv006.com.br", role: "Gestor de Unidade", unit: "Unidade Curitiba Centro", status: "active", lastAccess: "2024-01-09", avatar: "JC" },
  { id: 7, name: "Diego Martins", email: "diego@bv007.com.br", role: "Operador de Unidade", unit: "Unidade BH Savassi", status: "pending", lastAccess: "Nunca", avatar: "DM" },
  { id: 8, name: "Camila Torres", email: "camila@bellavita.com.br", role: "Visualizador", unit: "Rede completa", status: "inactive", lastAccess: "2023-12-15", avatar: "CT" },
];

export const mockAccessRequests = [
  { id: 1, requester: "Diego Martins", type: "Acesso de usuário", module: "Gestão de Unidades", unit: "Unidade BH Savassi", date: "2024-01-08", justification: "Novo gestor contratado para a unidade BH Savassi. Precisa de acesso para gerenciar operação.", status: "pending" as const },
  { id: 2, requester: "Carlos Menezes", type: "Permissão adicional", module: "Financeiro Simplificado", unit: "Unidade Centro SP", date: "2024-01-07", justification: "Preciso visualizar os dados financeiros da minha unidade para preparar relatório mensal.", status: "pending" as const },
  { id: 3, requester: "Beatriz Santos", type: "Acesso a módulo", module: "Atendimento WhatsApp", unit: "Unidade RJ Ipanema", date: "2024-01-06", justification: "Nossa unidade quer melhorar o atendimento ao cliente via WhatsApp. Módulo essencial para o nosso perfil.", status: "review" as const },
  { id: 4, requester: "Marcos Oliveira", type: "Criação de novo módulo", module: "Agenda de Serviços", unit: "Unidade Ribeirão Preto", date: "2024-01-04", justification: "Precisamos de um módulo para agendamento online de serviços integrado com nosso sistema atual.", status: "approved" as const },
  { id: 5, requester: "Patricia Souza", type: "Acesso a módulo", module: "Relatórios Avançados", unit: "Unidade Santos", date: "2024-01-03", justification: "Quero exportar dados de clientes para análise. Os relatórios básicos não atendem.", status: "denied" as const },
];

export const mockCashFlow = {
  months: ["Ago", "Set", "Out", "Nov", "Dez", "Jan"],
  income: [412000, 438000, 421000, 489000, 512000, 477400],
  expenses: [298000, 312000, 305000, 348000, 361000, 334200],
  daily: [
    { day: "01/01", income: 18400, expenses: 12100 },
    { day: "02/01", income: 22100, expenses: 14300 },
    { day: "03/01", income: 15600, expenses: 10200 },
    { day: "04/01", income: 28900, expenses: 18700 },
    { day: "05/01", income: 31200, expenses: 20100 },
    { day: "06/01", income: 19800, expenses: 12900 },
    { day: "07/01", income: 24700, expenses: 15800 },
    { day: "08/01", income: 26300, expenses: 16900 },
    { day: "09/01", income: 21100, expenses: 13800 },
  ],
};

export const mockDRE = [
  { item: "Receita Bruta", value: 477400, prev: 512000, type: "revenue" as const },
  { item: "(-) Impostos e Deduções", value: -57288, prev: -61440, type: "deduction" as const },
  { item: "= Receita Líquida", value: 420112, prev: 450560, type: "subtotal" as const },
  { item: "(-) CMV / CPV", value: -134176, prev: -144179, type: "deduction" as const },
  { item: "= Lucro Bruto", value: 285936, prev: 306381, type: "subtotal" as const },
  { item: "(-) Despesas Operacionais", value: -85932, prev: -92160, type: "deduction" as const },
  { item: "(-) Despesas com Pessoal", value: -71610, prev: -76800, type: "deduction" as const },
  { item: "(-) Marketing", value: -14322, prev: -15360, type: "deduction" as const },
  { item: "= EBITDA", value: 114072, prev: 122061, type: "subtotal" as const },
  { item: "(-) Depreciação e Amortização", value: -9548, prev: -10240, type: "deduction" as const },
  { item: "= EBIT", value: 104524, prev: 111821, type: "subtotal" as const },
  { item: "(-) Resultado Financeiro", value: -7161, prev: -7680, type: "deduction" as const },
  { item: "= Lucro Líquido", value: 97363, prev: 104141, type: "result" as const },
];

export const mockCMV = [
  { product: "Serviço Premium A", revenue: 124800, cost: 37440, margin: 70, cmv: 30, category: "Serviços" },
  { product: "Serviço Padrão B", revenue: 98600, cost: 35496, margin: 64, cmv: 36, category: "Serviços" },
  { product: "Produto Revenda C", revenue: 67400, cost: 32352, margin: 52, cmv: 48, category: "Produtos" },
  { product: "Pacote Mensal D", revenue: 89200, cost: 22300, margin: 75, cmv: 25, category: "Assinaturas" },
  { product: "Produto Revenda E", revenue: 43700, cost: 21850, margin: 50, cmv: 50, category: "Produtos" },
  { product: "Serviço Express F", revenue: 53700, cost: 15738, margin: 71, cmv: 29, category: "Serviços" },
];

export const mockRoyalties = [
  { unit: "Unidade Centro SP", code: "BV-001", revenue: 87400, royaltyRate: 7, royaltyValue: 6118, adFundRate: 2, adFundValue: 1748, total: 7866, status: "paid" as const, dueDate: "2024-01-15", paidDate: "2024-01-12" },
  { unit: "Unidade Curitiba Centro", code: "BV-006", revenue: 91700, royaltyRate: 7, royaltyValue: 6419, adFundRate: 2, adFundValue: 1834, total: 8253, status: "paid" as const, dueDate: "2024-01-15", paidDate: "2024-01-14" },
  { unit: "Unidade Moema", code: "BV-002", revenue: 72100, royaltyRate: 7, royaltyValue: 5047, adFundRate: 2, adFundValue: 1442, total: 6489, status: "overdue" as const, dueDate: "2024-01-15", paidDate: null },
  { unit: "Unidade Campinas", code: "BV-003", revenue: 54300, royaltyRate: 7, royaltyValue: 3801, adFundRate: 2, adFundValue: 1086, total: 4887, status: "pending" as const, dueDate: "2024-01-15", paidDate: null },
  { unit: "Unidade RJ Ipanema", code: "BV-008", revenue: 67800, royaltyRate: 7, royaltyValue: 4746, adFundRate: 2, adFundValue: 1356, total: 6102, status: "paid" as const, dueDate: "2024-01-15", paidDate: "2024-01-13" },
  { unit: "Unidade Santos", code: "BV-004", revenue: 38900, royaltyRate: 6, royaltyValue: 2334, adFundRate: 2, adFundValue: 778, total: 3112, status: "pending" as const, dueDate: "2024-01-15", paidDate: null },
  { unit: "Unidade Ribeirão Preto", code: "BV-005", revenue: 43200, royaltyRate: 6, royaltyValue: 2592, adFundRate: 2, adFundValue: 864, total: 3456, status: "paid" as const, dueDate: "2024-01-15", paidDate: "2024-01-11" },
  { unit: "Unidade BH Savassi", code: "BV-007", revenue: 22100, royaltyRate: 5, royaltyValue: 1105, adFundRate: 2, adFundValue: 442, total: 1547, status: "overdue" as const, dueDate: "2024-01-15", paidDate: null },
];

export const moduleCategories = ["Todos", "Gestão da Rede", "Clientes e CRM", "Financeiro", "Operação", "Atendimento", "Configurações", "IA", "Automações", "Relatórios", "Integrações"];

export const roles = [
  { id: "master", name: "Franqueador Master", description: "Acesso total à plataforma e todas as unidades", users: 1, color: "#6366F1" },
  { id: "financial-admin", name: "Admin Financeiro", description: "Gestão financeira da rede sem acesso operacional", users: 2, color: "#10B981" },
  { id: "operational-admin", name: "Admin Operacional", description: "Gestão operacional sem acesso financeiro", users: 1, color: "#F59E0B" },
  { id: "unit-manager", name: "Gestor de Unidade", description: "Gestão completa de uma unidade específica", users: 8, color: "#3B82F6" },
  { id: "unit-operator", name: "Operador de Unidade", description: "Operação diária sem permissões gerenciais", users: 16, color: "#64748B" },
  { id: "viewer", name: "Visualizador", description: "Apenas leitura, sem ações ou exportações", users: 3, color: "#94A3B8" },
];

export const permissionMatrix = [
  { module: "Gestão de Unidades", view: true, create: true, edit: true, del: false, approve: true, export: true, configure: true },
  { module: "Clientes & CRM", view: true, create: true, edit: true, del: false, approve: false, export: true, configure: false },
  { module: "Financeiro", view: true, create: true, edit: true, del: false, approve: true, export: true, configure: true },
  { module: "Fluxo de Caixa", view: true, create: true, edit: true, del: false, approve: false, export: true, configure: false },
  { module: "DRE Gerencial", view: true, create: false, edit: false, del: false, approve: false, export: true, configure: false },
  { module: "Royalties", view: true, create: false, edit: true, del: false, approve: true, export: true, configure: true },
  { module: "Checklists", view: true, create: true, edit: true, del: true, approve: false, export: true, configure: true },
  { module: "Pendências", view: true, create: true, edit: true, del: false, approve: true, export: false, configure: false },
  { module: "Automações", view: true, create: true, edit: true, del: true, approve: false, export: false, configure: true },
  { module: "Relatórios", view: true, create: false, edit: false, del: false, approve: false, export: true, configure: false },
];
