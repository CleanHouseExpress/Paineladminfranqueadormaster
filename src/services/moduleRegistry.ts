import type { ModuleDefinition } from '../types';

/**
 * Central Module Registry — single source of truth for all modules in the platform.
 *
 * Drives:
 *  - Sidebar navigation (nav config)
 *  - Application routes (routes[].path + componentId)
 *  - Module marketplace cards (marketplace config)
 *  - Breadcrumbs (path→label resolution)
 *  - ModuleGate permission checks (status + requiredPermissions)
 *  - Per-tenant activation state (compared against TenantContext.enabledModuleIds)
 *
 * To add a new module: append an entry here and add its componentId to COMPONENT_MAP
 * in src/app/App.tsx. No other files need to change.
 */
export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ─── Core / System ───────────────────────────────────────────────────────────

  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Painel executivo com visão geral da rede, alertas e indicadores consolidados.',
    icon: 'LayoutDashboard',
    status: 'active',
    nav: { show: true, order: 0, group: 'main' },
    routes: [{ path: '/', componentId: 'dashboard' }],
  },

  // ─── Gestão da Rede ───────────────────────────────────────────────────────────

  {
    id: 'units',
    name: 'Unidades',
    description: 'Cadastro, monitoramento e controle de todas as unidades da rede em um único painel.',
    icon: 'Building2',
    status: 'active',
    nav: { show: true, order: 1, group: 'main' },
    routes: [
      { path: '/units', componentId: 'units', requiredPermissions: ['tenant.units.view'] },
      { path: '/units/new', componentId: 'unit-new', requiredPermissions: ['tenant.units.create'] },
      { path: '/units/:id', componentId: 'unit-detail', requiredPermissions: ['tenant.units.update'] },
      { path: '/units/settings', componentId: 'unit-settings', requiredPermissions: ['tenant.units.configure'] },
    ],
    marketplace: { show: true, category: 'Gestão da Rede', price: 'Incluso' },
  },

  {
    id: 'customers',
    name: 'Clientes',
    description: 'Cadastro configuravel de clientes, pacientes, alunos ou associados por tenant.',
    icon: 'Users',
    status: 'active',
    nav: { show: true, order: 2, group: 'main' },
    routes: [
      { path: '/customers', componentId: 'customers', requiredPermissions: ['tenant.customers.view'] },
      { path: '/customers/new', componentId: 'customer-new', requiredPermissions: ['tenant.customers.create'] },
      { path: '/customers/:id', componentId: 'customer-detail', requiredPermissions: ['tenant.customers.update'] },
      { path: '/customers/settings', componentId: 'customer-settings', requiredPermissions: ['tenant.customers.configure'] },
    ],
    marketplace: { show: true, category: 'Clientes e CRM', price: 'Incluso' },
  },

  // ─── Financeiro ───────────────────────────────────────────────────────────────

  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Visão gerencial de receitas, despesas e resultado da rede sem complexidade de ERP.',
    icon: 'DollarSign',
    status: 'active',
    nav: {
      show: true,
      order: 3,
      group: 'main',
      children: [
        { label: 'Visão Geral', path: '/financial' },
        { label: 'Transações', path: '/financial/transactions' },
        { label: 'Contas Financeiras', path: '/financial/accounts' },
        { label: 'Fluxo de Caixa', path: '/financial/cashflow' },
        { label: 'DRE Gerencial', path: '/financial/dre' },
        { label: 'Royalties', path: '/royalties' },
      ],
    },
    routes: [
      { path: '/financial', componentId: 'financial-overview', requiredPermissions: ['tenant.financial.transactions.view'] },
      { path: '/financial/transactions', componentId: 'financial-transactions', moduleId: 'financial', requiredPermissions: ['tenant.financial.transactions.view'] },
      { path: '/financial/accounts', componentId: 'financial-accounts', moduleId: 'financial', requiredPermissions: ['tenant.financial.accounts.view'] },
      { path: '/financial/cashflow', componentId: 'cashflow', requiredPermissions: ['tenant.finance.view'] },
      { path: '/financial/dre', componentId: 'dre', moduleId: 'dre', requiredPermissions: ['tenant.dre.view'] },
      { path: '/financial/royalties', componentId: 'royalties', moduleId: 'royalties', requiredPermissions: ['tenant.royalties.view'] },
    ],
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },

  // Individual financial sub-modules (marketplace-facing metadata)
  {
    id: 'cashflow',
    name: 'Fluxo de Caixa',
    description: 'Acompanhamento de entradas e saídas em tempo real por unidade ou consolidado.',
    icon: 'TrendingUp',
    status: 'active',
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },
  {
    id: 'dre',
    name: 'DRE Gerencial',
    description: 'Demonstração de resultado simplificada e visual para tomada de decisão rápida.',
    icon: 'BarChart3',
    status: 'active',
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },
  {
    id: 'cmv',
    name: 'CMV',
    description: 'Indicadores operacionais de consumo, perdas e ajustes derivados do estoque.',
    icon: 'TrendingUp',
    status: 'active',
    nav: { show: true, order: 10, group: 'main', children: [
      { label: 'Visão Geral', path: '/cmv' },
      { label: 'Por Item', path: '/cmv/by-item' },
      { label: 'Por Unidade', path: '/cmv/by-unit' },
      { label: 'Por Origem', path: '/cmv/by-origin' },
    ] },
    routes: [
      { path: '/cmv', componentId: 'cmv-dashboard', requiredPermissions: ['tenant.cmv.view'] },
      { path: '/cmv/by-item', componentId: 'cmv-by-item', moduleId: 'cmv', requiredPermissions: ['tenant.cmv.view'] },
      { path: '/cmv/by-unit', componentId: 'cmv-by-unit', moduleId: 'cmv', requiredPermissions: ['tenant.cmv.view'] },
      { path: '/cmv/by-origin', componentId: 'cmv-by-origin', moduleId: 'cmv', requiredPermissions: ['tenant.cmv.view'] },
    ],
    marketplace: { show: true, category: 'Operação', price: 'Incluso' },
  },
  {
    id: 'sales',
    name: 'Vendas',
    description: 'Pedidos, vendas e ordens comerciais integrados ao catálogo e financeiro.',
    icon: 'ShoppingCart',
    status: 'active',
    nav: { show: true, order: 6, group: 'main' },
    routes: [
      { path: '/sales', componentId: 'sales-list', requiredPermissions: ['tenant.sales.view'] },
      { path: '/sales/new', componentId: 'sales-form', moduleId: 'sales', requiredPermissions: ['tenant.sales.create'] },
      { path: '/sales/settings', componentId: 'sales-settings', moduleId: 'sales', requiredPermissions: ['tenant.sales.configure'] },
      { path: '/sales/:id/edit', componentId: 'sales-form', moduleId: 'sales', requiredPermissions: ['tenant.sales.update'] },
      { path: '/sales/:id', componentId: 'sales-detail', moduleId: 'sales', requiredPermissions: ['tenant.sales.view'] },
    ],
    marketplace: { show: true, category: 'Comercial', price: 'Incluso' },
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Leads, pipeline, oportunidades, atividades e conversão comercial.',
    icon: 'Target',
    status: 'active',
    nav: {
      show: true,
      order: 6.2,
      group: 'main',
      children: [
        { label: 'Visão Geral', path: '/crm' },
        { label: 'Kanban', path: '/crm/kanban' },
        { label: 'Leads', path: '/crm/leads' },
        { label: 'Pipelines', path: '/crm/pipelines' },
        { label: 'Configurações', path: '/crm/settings' },
      ],
    },
    routes: [
      { path: '/crm', componentId: 'crm-dashboard', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/kanban', componentId: 'crm-kanban', moduleId: 'crm', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/leads', componentId: 'crm-leads', moduleId: 'crm', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/leads/new', componentId: 'crm-lead-form', moduleId: 'crm', requiredPermissions: ['tenant.crm.create'] },
      { path: '/crm/leads/:id/edit', componentId: 'crm-lead-form', moduleId: 'crm', requiredPermissions: ['tenant.crm.update'] },
      { path: '/crm/leads/:id', componentId: 'crm-lead-detail', moduleId: 'crm', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/pipelines', componentId: 'crm-pipelines', moduleId: 'crm', requiredPermissions: ['tenant.crm.manage_pipeline'] },
      { path: '/crm/settings', componentId: 'crm-settings', moduleId: 'crm', requiredPermissions: ['tenant.crm.configure'] },
    ],
    marketplace: { show: true, category: 'Comercial', price: 'Incluso' },
  },
  {
    id: 'royalties',
    name: 'Royalties',
    description: 'Cálculo, cobrança e controle de royalties e taxas de franquia por unidade.',
    icon: 'Receipt',
    status: 'active',
    nav: {
      show: false,
      order: 3.5,
      group: 'main',
      children: [
        { label: 'Visão Geral', path: '/royalties' },
        { label: 'Regras', path: '/royalties/rules' },
        { label: 'Competências', path: '/royalties/calculations' },
        { label: 'Vínculos', path: '/royalties/settings' },
      ],
    },
    routes: [
      { path: '/royalties', componentId: 'royalties', requiredPermissions: ['tenant.royalties.view'] },
      { path: '/royalties/rules', componentId: 'royalty-rules', moduleId: 'royalties', requiredPermissions: ['tenant.royalties.view'] },
      { path: '/royalties/calculations', componentId: 'royalty-calculations', moduleId: 'royalties', requiredPermissions: ['tenant.royalties.view'] },
      { path: '/royalties/settings', componentId: 'royalty-settings', moduleId: 'royalties', requiredPermissions: ['tenant.royalties.configure'] },
    ],
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },

  // ─── Operação ─────────────────────────────────────────────────────────────────

  {
    id: 'operations',
    name: 'Operação',
    description: 'Checklists, pendências e diário de bordo para gestão operacional da rede.',
    icon: 'ClipboardCheck',
    status: 'active',
    nav: { show: true, order: 4, group: 'main' },
    routes: [{ path: '/operations', componentId: 'operations' }],
    marketplace: { show: true, category: 'Operação', price: 'Incluso' },
  },
  {
    id: 'checklists',
    name: 'Checklists Operacionais',
    description: 'Criação e acompanhamento de checklists para padronização de processos na rede.',
    icon: 'ClipboardList',
    status: 'active',
    nav: {
      show: true,
      order: 4.5,
      group: 'main',
      children: [
        { label: 'Dashboard', path: '/checklists' },
        { label: 'Modelos', path: '/checklists/templates' },
        { label: 'Execucoes', path: '/checklists/executions' },
      ],
    },
    routes: [
      { path: '/checklists', componentId: 'checklists', requiredPermissions: ['tenant.checklists.view'] },
      { path: '/checklists/templates', componentId: 'checklist-templates', requiredPermissions: ['tenant.checklists.view'] },
      { path: '/checklists/templates/new', componentId: 'checklist-template-new', requiredPermissions: ['tenant.checklists.create'] },
      { path: '/checklists/templates/:id', componentId: 'checklist-template-detail', requiredPermissions: ['tenant.checklists.update'] },
      { path: '/checklists/executions', componentId: 'checklist-executions', requiredPermissions: ['tenant.checklists.view'] },
      { path: '/checklists/executions/:id', componentId: 'checklist-execution-detail', requiredPermissions: ['tenant.checklists.execute'] },
    ],
    marketplace: { show: true, category: 'Operação', price: 'Incluso' },
  },
  {
    id: 'pendencias',
    name: 'Pendências & Tarefas',
    description: 'Gestão de pendências críticas com atribuição, prazo e acompanhamento.',
    icon: 'AlertCircle',
    status: 'active',
    marketplace: { show: true, category: 'Operação', price: 'Incluso' },
  },
  {
    id: 'diario',
    name: 'Diário de Bordo',
    description: 'Registro diário das operações de cada unidade com histórico e auditoria.',
    icon: 'BookOpen',
    status: 'active',
    marketplace: { show: true, category: 'Operação', price: 'Incluso' },
  },

  {
    id: 'documents',
    name: 'Documentos',
    description: 'Biblioteca central de documentos do tenant.',
    icon: 'FolderOpen',
    status: 'active',
    nav: { show: true, order: 5, group: 'main', children: [
      { label: 'Biblioteca', path: '/documents' },
      { label: 'Categorias', path: '/documents/categories' },
    ] },
    routes: [
      { path: '/documents', componentId: 'documents-list', requiredPermissions: ['tenant.documents.view'] },
      { path: '/documents/new', componentId: 'documents-form', moduleId: 'documents', requiredPermissions: ['tenant.documents.upload'] },
      { path: '/documents/categories', componentId: 'documents-categories', moduleId: 'documents', requiredPermissions: ['tenant.documents.configure'] },
      { path: '/documents/settings', componentId: 'documents-settings', moduleId: 'documents', requiredPermissions: ['tenant.documents.configure'] },
      { path: '/documents/:id', componentId: 'documents-detail', moduleId: 'documents', requiredPermissions: ['tenant.documents.view'] },
    ],
    marketplace: { show: true, category: 'Gestão da Rede', price: 'Incluso' },
  },
  {
    id: 'contracts',
    name: 'Contratos',
    description: 'Gestão de contratos vinculados a clientes, unidades e documentos.',
    icon: 'ScrollText',
    status: 'active',
    nav: { show: true, order: 5.2, group: 'main', children: [
      { label: 'Contratos', path: '/contracts' },
      { label: 'Configurações', path: '/contracts/settings' },
    ] },
    routes: [
      { path: '/contracts', componentId: 'contracts-list', requiredPermissions: ['tenant.contracts.view'] },
      { path: '/contracts/new', componentId: 'contracts-form', moduleId: 'contracts', requiredPermissions: ['tenant.contracts.create'] },
      { path: '/contracts/settings', componentId: 'contracts-settings', moduleId: 'contracts', requiredPermissions: ['tenant.contracts.configure'] },
      { path: '/contracts/:id/edit', componentId: 'contracts-form', moduleId: 'contracts', requiredPermissions: ['tenant.contracts.update'] },
      { path: '/contracts/:id', componentId: 'contracts-detail', moduleId: 'contracts', requiredPermissions: ['tenant.contracts.view'] },
    ],
    marketplace: { show: true, category: 'Gestão da Rede', price: 'Incluso' },
  },
  {
    id: 'catalog',
    name: 'Catálogo',
    description: 'Produtos, serviços, cursos, planos e demais itens comercializáveis.',
    icon: 'Package',
    status: 'active',
    nav: { show: true, order: 5.4, group: 'main', children: [
      { label: 'Catálogo', path: '/catalog' },
      { label: 'Configurações', path: '/catalog/settings' },
    ] },
    routes: [
      { path: '/catalog', componentId: 'catalog-list', requiredPermissions: ['tenant.catalog.view'] },
      { path: '/catalog/new', componentId: 'catalog-form', moduleId: 'catalog', requiredPermissions: ['tenant.catalog.create'] },
      { path: '/catalog/settings', componentId: 'catalog-settings', moduleId: 'catalog', requiredPermissions: ['tenant.catalog.configure'] },
      { path: '/catalog/:id/edit', componentId: 'catalog-form', moduleId: 'catalog', requiredPermissions: ['tenant.catalog.update'] },
      { path: '/catalog/:id', componentId: 'catalog-detail', moduleId: 'catalog', requiredPermissions: ['tenant.catalog.view'] },
    ],
    marketplace: { show: true, category: 'Gestão da Rede', price: 'Incluso' },
  },
  {
    id: 'inventory',
    name: 'Estoque',
    description: 'Controle de insumos, fornecedores, saldos por unidade, movimentações e custos médios.',
    icon: 'Boxes',
    status: 'active',
    nav: { show: true, order: 5.5, group: 'main', children: [
      { label: 'Visão Geral', path: '/inventory' },
      { label: 'Insumos', path: '/inventory/items' },
      { label: 'Categorias', path: '/inventory/categories' },
      { label: 'Fornecedores', path: '/inventory/suppliers' },
      { label: 'Movimentações', path: '/inventory/movements' },
      { label: 'Configurações', path: '/inventory/settings' },
    ] },
    routes: [
      { path: '/inventory', componentId: 'inventory-dashboard', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/items', componentId: 'inventory-items', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/items/new', componentId: 'inventory-item-form', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.create'] },
      { path: '/inventory/items/:id/edit', componentId: 'inventory-item-form', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.update'] },
      { path: '/inventory/items/:id', componentId: 'inventory-item-detail', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/categories', componentId: 'inventory-categories', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/suppliers', componentId: 'inventory-suppliers', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/movements', componentId: 'inventory-movements', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/settings', componentId: 'inventory-settings', moduleId: 'inventory', requiredPermissions: ['tenant.inventory.configure'] },
    ],
    marketplace: { show: true, category: 'Operação', price: 'Incluso' },
  },
  {
    id: 'trainings',
    name: 'Treinamentos',
    description: 'Capacitação, materiais e progresso por usuário.',
    icon: 'GraduationCap',
    status: 'active',
    nav: { show: true, order: 5.6, group: 'main', children: [
      { label: 'Treinamentos', path: '/trainings' },
      { label: 'Configurações', path: '/trainings/settings' },
    ] },
    routes: [
      { path: '/trainings', componentId: 'trainings-list', requiredPermissions: ['tenant.trainings.view'] },
      { path: '/trainings/new', componentId: 'trainings-form', moduleId: 'trainings', requiredPermissions: ['tenant.trainings.create'] },
      { path: '/trainings/settings', componentId: 'trainings-settings', moduleId: 'trainings', requiredPermissions: ['tenant.trainings.configure'] },
      { path: '/trainings/:id/edit', componentId: 'trainings-form', moduleId: 'trainings', requiredPermissions: ['tenant.trainings.update'] },
      { path: '/trainings/:id', componentId: 'trainings-detail', moduleId: 'trainings', requiredPermissions: ['tenant.trainings.view'] },
    ],
    marketplace: { show: true, category: 'Gestão da Rede', price: 'Incluso' },
  },

  // ─── Atendimento ──────────────────────────────────────────────────────────────

  {
    id: 'support',
    name: 'Atendimento',
    description: 'Central de atendimento multicanal. Ative o módulo WhatsApp ou Instagram para começar.',
    icon: 'MessageCircle',
    status: 'active',
    nav: { show: true, order: 5, group: 'main' },
    routes: [{ path: '/support', componentId: 'support' }],
  },
  {
    id: 'whatsapp',
    name: 'Atendimento WhatsApp',
    description: 'Central de atendimento multicanal via WhatsApp com distribuição por unidade.',
    icon: 'MessageCircle',
    status: 'available',
    marketplace: { show: true, category: 'Atendimento', price: 'R$ 297/mês' },
    price: 'R$ 297/mês',
  },
  {
    id: 'instagram',
    name: 'Atendimento Instagram',
    description: 'Gestão de mensagens e comentários do Instagram de todas as unidades.',
    icon: 'Instagram',
    status: 'review',
    marketplace: { show: true, category: 'Atendimento', price: 'R$ 197/mês' },
    price: 'R$ 197/mês',
  },

  // ─── IA ───────────────────────────────────────────────────────────────────────

  {
    id: 'agente-ia',
    name: 'Agente IA',
    description: 'Assistente inteligente para resposta automática, análise e sugestões operacionais.',
    icon: 'Bot',
    status: 'development',
    marketplace: { show: true, category: 'IA', price: 'Em breve' },
  },

  // ─── Automações ───────────────────────────────────────────────────────────────

  {
    id: 'automations',
    name: 'Automações',
    description: 'Fluxos automatizados para notificações, cobranças e processos repetitivos.',
    icon: 'Zap',
    status: 'available',
    nav: { show: true, order: 6, group: 'main' },
    routes: [{ path: '/automations', componentId: 'automations' }],
    marketplace: { show: true, category: 'Automações', price: 'R$ 197/mês' },
    price: 'R$ 197/mês',
  },

  // ─── Relatórios ───────────────────────────────────────────────────────────────

  {
    id: 'reports',
    name: 'Relatórios',
    description: 'Relatórios customizados com exportação e agendamento automático.',
    icon: 'BarChart3',
    status: 'available',
    nav: { show: true, order: 7, group: 'main' },
    routes: [{ path: '/reports', componentId: 'reports' }],
    marketplace: { show: true, category: 'Relatórios', price: 'R$ 97/mês' },
    price: 'R$ 97/mês',
  },

  // ─── Integrações ──────────────────────────────────────────────────────────────

  {
    id: 'integrations',
    name: 'Integrações',
    description: 'Conexão com ERPs, gateways de pagamento, plataformas de delivery e mais.',
    icon: 'Plug',
    status: 'available',
    marketplace: { show: true, category: 'Integrações', price: 'Sob consulta' },
    price: 'Sob consulta',
  },

  // ─── CRM add-ons ─────────────────────────────────────────────────────────────

  {
    id: 'nps',
    name: 'NPS & Satisfação',
    description: 'Pesquisas de satisfação automatizadas e acompanhamento de NPS por unidade.',
    icon: 'Star',
    status: 'development',
    marketplace: { show: true, category: 'Clientes e CRM', price: 'Em breve' },
  },

  // ─── Insumos ──────────────────────────────────────────────────────────────────

  // ─── System modules (always visible, not in marketplace) ─────────────────────

  {
    id: 'marketplace',
    name: 'Módulos',
    description: 'Central de módulos — ative, solicite e gerencie os módulos da plataforma.',
    icon: 'Puzzle',
    status: 'active',
    nav: { show: true, order: 8, group: 'main' },
    routes: [
      { path: '/modules', componentId: 'marketplace' },
      { path: '/modules/request-new', componentId: 'request-new-module' },
      { path: '/modules/:id', componentId: 'module-detail' },
      { path: '/modules/:id/request', componentId: 'request-module-access' },
    ],
  },

  {
    id: 'access',
    name: 'Acessos',
    description: 'Gestão de usuários, perfis de permissão e solicitações de acesso.',
    icon: 'Shield',
    status: 'active',
    nav: {
      show: true,
      order: 9,
      group: 'system',
      children: [
        { label: 'Usuarios', path: '/users' },
        { label: 'Perfis', path: '/access' },
        { label: 'Permissões', path: '/access/permissions' },
        { label: 'Solicitações', path: '/access/requests', badge: 3 },
      ],
    },
    routes: [
      { path: '/users', componentId: 'users', requiredPermissions: ['tenant.users.view'] },
      { path: '/users/new', componentId: 'user-new', requiredPermissions: ['tenant.users.create'] },
      { path: '/users/:id', componentId: 'user-detail', requiredPermissions: ['tenant.users.update'] },
      { path: '/access', componentId: 'access-permissions' },
      { path: '/access/permissions', componentId: 'access-permissions' },
      { path: '/access/requests', componentId: 'access-requests' },
    ],
  },

  {
    id: 'settings',
    name: 'Configurações',
    description: 'Configurações gerais, white label, menu e segurança da plataforma.',
    icon: 'Settings',
    status: 'active',
    nav: {
      show: true,
      order: 10,
      group: 'system',
      children: [
        { label: 'Geral', path: '/settings' },
        { label: 'White Label', path: '/settings/whitelabel' },
        { label: 'Menu', path: '/settings/menu' },
        { label: 'Form Builder', path: '/settings/form-builder' },
      ],
    },
    routes: [
      { path: '/settings', componentId: 'settings' },
      { path: '/settings/menu', componentId: 'menu-config' },
      { path: '/settings/whitelabel', componentId: 'white-label' },
      { path: '/settings/notifications', componentId: 'settings-placeholder' },
      { path: '/settings/security', componentId: 'settings-placeholder' },
      { path: '/settings/data', componentId: 'settings-placeholder' },
      { path: '/settings/billing', componentId: 'settings-placeholder' },
    ],
  },

  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Dashboard executivo dinâmico com métricas, filtros e widgets personalizados.',
    icon: 'LayoutDashboard',
    status: 'active',
    nav: {
      show: true,
      order: 13,
      group: 'system',
      children: [
        { label: 'Dashboard', path: '/analytics' },
        { label: 'Personalizar', path: '/analytics/edit' },
      ],
    },
    routes: [
      {
        path: '/analytics',
        componentId: 'analytics-dashboard',
        moduleId: 'dashboard',
        requiredPermissions: ['tenant.analytics.view'],
      },
      {
        path: '/analytics/edit',
        componentId: 'analytics-dashboard',
        moduleId: 'dashboard',
        requiredPermissions: ['tenant.analytics.update'],
      },
    ],
  },

  // ─── Form Builder (Metadata Engine) ──────────────────────────────────────────

  {
    id: 'form-builder',
    name: 'Form Builder',
    description: 'Metadata Engine — configure campos, formulários e estrutura de dados de toda a plataforma sem escrever código.',
    icon: 'LayoutTemplate',
    status: 'active',
    routes: [
      { path: '/settings/form-builder', componentId: 'form-builder-catalog' },
      { path: '/settings/form-builder/:entityId', componentId: 'form-builder-fields' },
      { path: '/settings/form-builder/:entityId/organize', componentId: 'form-builder-organizer' },
      { path: '/settings/form-builder/:entityId/history', componentId: 'form-builder-history' },
      { path: '/settings/form-builder/:entityId/versions', componentId: 'form-builder-versions' },
    ],
  },
];

// ─── Registry helpers ──────────────────────────────────────────────────────────

/** All modules visible in the sidebar, sorted by nav.order */
export const NAV_MODULES = MODULE_REGISTRY
  .filter(m => m.nav?.show)
  .sort((a, b) => (a.nav!.order) - (b.nav!.order));

/** All modules that appear in the marketplace */
export const MARKETPLACE_MODULES = MODULE_REGISTRY
  .filter(m => m.marketplace?.show);

/** Flat list of all route configs across all modules */
export const ALL_ROUTES = MODULE_REGISTRY
  .filter(m => m.routes?.length)
  .flatMap(m => m.routes!.map(route => ({
    ...route,
    moduleId: route.moduleId ?? m.id,
    requiredPermissions: route.requiredPermissions ?? m.requiredPermissions,
  })));

/** Resolve a path to a breadcrumb label using the registry */
export function resolveBreadcrumb(pathname: string): Array<{ label: string; path: string }> {
  const crumbs: Array<{ label: string; path: string }> = [];

  for (const mod of MODULE_REGISTRY) {
    if (!mod.nav) continue;

    // Check if this nav item or any of its children matches the path
    if (mod.nav.children) {
      const child = mod.nav.children.find(c => c.path === pathname);
      if (child) {
        // Parent crumb
        const parentPath = mod.routes?.[0]?.path ?? '#';
        crumbs.push({ label: mod.nav.label ?? mod.name, path: parentPath });
        crumbs.push({ label: child.label, path: child.path });
        return crumbs;
      }
    }

    // Direct match
    const directMatch = mod.routes?.find(r => r.path === pathname);
    if (directMatch && !mod.nav.children) {
      crumbs.push({ label: mod.nav.label ?? mod.name, path: pathname });
      return crumbs;
    }
  }

  return crumbs;
}

/** Look up a module by id */
export function getModule(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find(m => m.id === id);
}

const LEGACY_MODULE_ID_ALIASES: Record<string, string> = {
  automacoes: 'automations',
  relatorios: 'reports',
  integracoes: 'integrations',
};

/** Look up a module by current id, accepting old front-end ids used by early mocks */
export function getModuleByIdOrAlias(id: string): ModuleDefinition | undefined {
  return getModule(LEGACY_MODULE_ID_ALIASES[id] ?? id);
}

/** Look up a module by its primary route path */
export function getModuleByPath(pathname: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find(m =>
    m.routes?.some(r => r.path === pathname || pathname.startsWith(r.path.replace(':id', '')))
  );
}
