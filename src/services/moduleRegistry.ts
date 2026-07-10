import type { ModuleDefinition } from '../types';

/**
 * Central Module Registry â€” single source of truth for all modules in the platform.
 *
 * Drives:
 *  - Sidebar navigation (nav config)
 *  - Application routes (routes[].path + componentId)
 *  - Module marketplace cards (marketplace config)
 *  - Breadcrumbs (pathâ†’label resolution)
 *  - ModuleGate permission checks (status + requiredPermissions)
 *  - Per-tenant activation state (compared against TenantContext.enabledModuleIds)
 *
 * To add a new module: append an entry here and add its componentId to COMPONENT_MAP
 * in src/app/App.tsx. No other files need to change.
 */
export const MODULE_REGISTRY: ModuleDefinition[] = [
  // â”€â”€â”€ Core / System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Painel executivo com visÃ£o geral da rede, alertas e indicadores consolidados.',
    icon: 'LayoutDashboard',
    status: 'active',
    nav: { show: true, order: 0, group: 'main' },
    routes: [
      { path: '/', componentId: 'dashboard' },
      { path: '/dashboard', componentId: 'dashboard' },
    ],
  },

  // â”€â”€â”€ GestÃ£o da Rede â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'units',
    name: 'Unidades',
    description: 'Cadastro, monitoramento e controle de todas as unidades da rede em um Ãºnico painel.',
    icon: 'Building2',
    status: 'active',
    nav: {
      show: true,
      order: 1,
      group: 'main',
      children: [
        { label: 'Unidades', path: '/units' },
        { label: 'Implantacoes', path: '/implementations' },
        { label: 'Templates de implantacao', path: '/implementations/templates' },
      ],
    },
    routes: [
      { path: '/units', componentId: 'units', requiredPermissions: ['tenant.units.view'] },
      { path: '/units/new', componentId: 'unit-new', requiredPermissions: ['tenant.units.create'] },
      { path: '/units/:id', componentId: 'unit-detail', requiredPermissions: ['tenant.units.update'] },
      { path: '/units/settings', componentId: 'unit-settings', requiredPermissions: ['tenant.units.configure'] },
      { path: '/implementations', componentId: 'implementations-dashboard', moduleId: 'units', requiredPermissions: ['tenant.units.view'] },
      { path: '/implementations/templates', componentId: 'implementation-templates', moduleId: 'units', requiredPermissions: ['tenant.units.configure'] },
    ],
    marketplace: { show: true, category: 'GestÃ£o da Rede', price: 'Incluso' },
  },

  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Programas versionados para conduzir redes, unidades e franqueados ate o Go Live.',
    icon: 'Rocket',
    status: 'active',
    nav: {
      show: true,
      order: 1.5,
      group: 'main',
      children: [
        { label: 'Programas', path: '/onboarding/programs' },
        { label: 'Implementations', path: '/onboarding/implementations' },
      ],
    },
    routes: [
      { path: '/onboarding/programs', componentId: 'onboarding-program-builder', requiredPermissions: ['tenant.onboarding.programs.view'] },
      { path: '/onboarding/implementations', componentId: 'onboarding-implementation-lifecycle', requiredPermissions: ['tenant.onboarding.implementations.view'] },
    ],
    marketplace: { show: true, category: 'Gestao da Rede', price: 'Incluso' },
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
  {
    id: 'crm', name: 'CRM', description: 'Pipeline comercial, leads e atividades.', icon: 'ContactRound', status: 'active',
    nav: { show: true, order: 2.5, group: 'main', children: [
      { label: 'Visao geral', path: '/crm' }, { label: 'Kanban', path: '/crm/kanban' },
      { label: 'Leads', path: '/crm/leads' }, { label: 'Pipelines', path: '/crm/pipelines' },
    ] },
    routes: [
      { path: '/crm', componentId: 'crm-dashboard', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/kanban', componentId: 'crm-kanban', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/leads', componentId: 'crm-leads', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/leads/new', componentId: 'crm-lead-form', requiredPermissions: ['tenant.crm.create'] },
      { path: '/crm/leads/:id/edit', componentId: 'crm-lead-form', requiredPermissions: ['tenant.crm.update'] },
      { path: '/crm/leads/:id', componentId: 'crm-lead-detail', requiredPermissions: ['tenant.crm.view'] },
      { path: '/crm/pipelines', componentId: 'crm-pipelines', requiredPermissions: ['tenant.crm.manage_pipeline'] },
      { path: '/crm/settings', componentId: 'crm-settings', requiredPermissions: ['tenant.crm.configure'] },
    ],
  },
  {
    id: 'catalog', name: 'Catalogo', description: 'Produtos e servicos comercializados.', icon: 'BookOpenCheck', status: 'active',
    nav: { show: true, order: 2.75, group: 'main' },
    routes: [
      { path: '/catalog', componentId: 'catalog-list', requiredPermissions: ['tenant.catalog.view'] },
      { path: '/catalog/approvals', componentId: 'catalog-list', requiredPermissions: ['tenant.catalog.approve'] },
      { path: '/catalog/local', componentId: 'catalog-list', requiredPermissions: ['tenant.catalog.view'] },
      { path: '/catalog/new', componentId: 'catalog-form', requiredPermissions: ['tenant.catalog.create'] },
      { path: '/catalog/settings', componentId: 'catalog-settings', requiredPermissions: ['tenant.catalog.configure'] },
      { path: '/catalog/:id/edit', componentId: 'catalog-form', requiredPermissions: ['tenant.catalog.update'] },
      { path: '/catalog/:id', componentId: 'catalog-detail', requiredPermissions: ['tenant.catalog.view'] },
    ],
  },

  // â”€â”€â”€ Financeiro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'financial',
    name: 'Financeiro',
    description: 'VisÃ£o gerencial de receitas, despesas e resultado da rede sem complexidade de ERP.',
    icon: 'DollarSign',
    status: 'active',
    nav: {
      show: true,
      order: 3,
      group: 'main',
      children: [
        { label: 'VisÃ£o Geral', path: '/financial' },
        { label: 'TransaÃ§Ãµes', path: '/financial/transactions' },
        { label: 'Contas Financeiras', path: '/financial/accounts' },
        { label: 'Fluxo de Caixa', path: '/financial/cashflow' },
        { label: 'DRE Gerencial', path: '/financial/dre' },
        { label: 'Metas do DRE', path: '/dre/goals' },
        { label: 'HistÃ³rico do DRE', path: '/dre/history' },
        { label: 'ProjeÃ§Ã£o do DRE', path: '/dre/projection' },
        { label: 'Royalties', path: '/financial/royalties' },
        { label: 'ConfiguraÃ§Ã£o de Royalties', path: '/royalties/settings' },
        { label: 'Fechamento de Royalties', path: '/royalties/periods' },
      ],
    },
    routes: [
      { path: '/financial', componentId: 'financial-overview', requiredPermissions: ['tenant.finance.view'] },
      { path: '/financial/transactions', componentId: 'financial-transactions', moduleId: 'financial', requiredPermissions: ['tenant.finance.view'] },
      { path: '/financial/accounts', componentId: 'financial-accounts', moduleId: 'financial', requiredPermissions: ['tenant.financial.accounts.view'] },
      { path: '/financial/cashflow', componentId: 'cashflow', requiredPermissions: ['tenant.finance.view'] },
      { path: '/dre', componentId: 'dre', moduleId: 'financial', requiredPermissions: ['tenant.finance.view'] },
      { path: '/financial/dre', componentId: 'dre', requiredPermissions: ['tenant.finance.view'] },
      { path: '/dre/goals', componentId: 'dre-goals', moduleId: 'financial', requiredPermissions: ['tenant.dre.view'] },
      { path: '/dre/history', componentId: 'dre-history', moduleId: 'financial', requiredPermissions: ['tenant.dre.view'] },
      { path: '/dre/projection', componentId: 'dre-projection', moduleId: 'financial', requiredPermissions: ['tenant.dre.view'] },
      { path: '/financial/royalties', componentId: 'royalties', moduleId: 'financial', requiredPermissions: ['tenant.royalties.view'] },
      { path: '/royalties', componentId: 'royalties', moduleId: 'financial', requiredPermissions: ['tenant.royalties.view'] },
      { path: '/royalties/rules', componentId: 'royalty-rules', moduleId: 'financial', requiredPermissions: ['tenant.royalties.view'] },
      { path: '/royalties/calculations', componentId: 'royalty-calculations', moduleId: 'financial', requiredPermissions: ['tenant.royalties.view'] },
      { path: '/royalties/settings', componentId: 'royalty-settings', moduleId: 'financial', requiredPermissions: ['tenant.royalties.configure'] },
      { path: '/royalties/periods', componentId: 'royalty-periods', moduleId: 'financial', requiredPermissions: ['tenant.royalties.view'] },
    ],
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },

  // Individual financial sub-modules (marketplace-facing metadata)
  {
    id: 'cashflow',
    name: 'Fluxo de Caixa',
    description: 'Acompanhamento de entradas e saÃ­das em tempo real por unidade ou consolidado.',
    icon: 'TrendingUp',
    status: 'active',
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },
  {
    id: 'dre',
    name: 'DRE Gerencial',
    description: 'DemonstraÃ§Ã£o de resultado simplificada e visual para tomada de decisÃ£o rÃ¡pida.',
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
      { label: 'VisÃ£o Geral', path: '/cmv' },
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
    marketplace: { show: true, category: 'OperaÃ§Ã£o', price: 'Incluso' },
  },
  {
    id: 'royalties',
    name: 'Royalties',
    description: 'CÃ¡lculo, cobranÃ§a e controle de royalties e taxas de franquia por unidade.',
    icon: 'Receipt',
    status: 'active',
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },
  {
    id: 'sales',
    name: 'Vendas',
    description: 'Pedidos, vendas e ordens comerciais integrados ao catÃ¡logo e financeiro.',
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

  // â”€â”€â”€ OperaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'loyalty',
    name: 'Fidelidade',
    description: 'Cashback, regras de concessao, carteiras de clientes e indicadores de passivo.',
    icon: 'Gift',
    status: 'active',
    nav: {
      show: true,
      order: 6.5,
      group: 'main',
      children: [
        { label: 'Dashboard', path: '/loyalty/cashback' },
        { label: 'Regras', path: '/loyalty/cashback/rules' },
        { label: 'Carteiras', path: '/loyalty/cashback/wallets' },
        { label: 'Configuracoes', path: '/loyalty/cashback/settings' },
      ],
    },
    routes: [
      { path: '/loyalty', componentId: 'loyalty-dashboard', moduleId: 'loyalty', requiredPermissions: ['tenant.loyalty.view'] },
      { path: '/loyalty/cashback', componentId: 'loyalty-dashboard', moduleId: 'loyalty', requiredPermissions: ['tenant.loyalty.view'] },
      { path: '/loyalty/cashback/rules', componentId: 'loyalty-rules', moduleId: 'loyalty', requiredPermissions: ['tenant.loyalty.rules.view'] },
      { path: '/loyalty/cashback/wallets', componentId: 'loyalty-wallets', moduleId: 'loyalty', requiredPermissions: ['tenant.loyalty.wallets.view'] },
      { path: '/loyalty/cashback/wallets/:customerId', componentId: 'loyalty-wallet-detail', moduleId: 'loyalty', requiredPermissions: ['tenant.loyalty.wallets.view'] },
      { path: '/loyalty/cashback/settings', componentId: 'loyalty-settings', moduleId: 'loyalty', requiredPermissions: ['tenant.loyalty.configure'] },
    ],
    marketplace: { show: true, category: 'Comercial', price: 'Incluso' },
  },
  {
    id: 'inventory',
    name: 'Estoque & Suprimentos',
    description: 'Estoque configurÃ¡vel, movimentaÃ§Ãµes, transferÃªncias e inventÃ¡rio fÃ­sico.',
    icon: 'Boxes',
    status: 'active',
    nav: { show: true, order: 5, group: 'main', children: [
      { label: 'VisÃ£o Geral', path: '/inventory' }, { label: 'Itens', path: '/inventory/items' },
      { label: 'MovimentaÃ§Ãµes', path: '/inventory/movements' }, { label: 'ConfiguraÃ§Ãµes', path: '/inventory/settings' },
    ] },
    routes: [
      { path: '/inventory', componentId: 'inventory-dashboard', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/items', componentId: 'inventory-items', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/items/new', componentId: 'inventory-item-form', requiredPermissions: ['tenant.inventory.create'] },
      { path: '/inventory/items/:id/edit', componentId: 'inventory-item-form', requiredPermissions: ['tenant.inventory.update'] },
      { path: '/inventory/items/:id', componentId: 'inventory-item-detail', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/categories', componentId: 'inventory-categories', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/suppliers', componentId: 'inventory-suppliers', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/movements', componentId: 'inventory-movements', requiredPermissions: ['tenant.inventory.view'] },
      { path: '/inventory/settings', componentId: 'inventory-settings', requiredPermissions: ['tenant.inventory.settings.view'] },
      { path: '/inventory/transfers', componentId: 'inventory-transfers', requiredPermissions: ['tenant.inventory.transfer'] },
      { path: '/inventory/transfers/:id', componentId: 'inventory-transfer-detail', requiredPermissions: ['tenant.inventory.transfer'] },
      { path: '/inventory/counts', componentId: 'inventory-counts', requiredPermissions: ['tenant.inventory.count'] },
      { path: '/inventory/counts/:id', componentId: 'inventory-count-detail', requiredPermissions: ['tenant.inventory.count'] },
    ],
    marketplace: { show: true, category: 'OperaÃ§Ã£o', price: 'Incluso' },
  },

  {
    id: 'documents',
    name: 'Documentos',
    description: 'Biblioteca operacional de documentos com upload, categorias, download e visibilidade por tenant.',
    icon: 'FolderOpen',
    status: 'active',
    nav: { show: true, order: 4.25, group: 'main', children: [
      { label: 'Biblioteca', path: '/documents' },
      { label: 'Categorias', path: '/documents/categories' },
    ] },
    routes: [
      { path: '/documents', componentId: 'documents-list', requiredPermissions: ['tenant.documents.view'] },
      { path: '/documents/new', componentId: 'document-new', moduleId: 'documents', requiredPermissions: ['tenant.documents.upload'] },
      { path: '/documents/categories', componentId: 'document-categories', moduleId: 'documents', requiredPermissions: ['tenant.documents.configure'] },
      { path: '/documents/settings', componentId: 'document-settings', moduleId: 'documents', requiredPermissions: ['tenant.documents.configure'] },
      { path: '/documents/:id', componentId: 'document-detail', moduleId: 'documents', requiredPermissions: ['tenant.documents.view'] },
    ],
    marketplace: { show: true, category: 'Operacao', price: 'Incluso' },
  },
  {
    id: 'operations',
    name: 'OperaÃ§Ã£o',
    description: 'Checklists, pendÃªncias e diÃ¡rio de bordo para gestÃ£o operacional da rede.',
    icon: 'ClipboardCheck',
    status: 'active',
    nav: { show: true, order: 4, group: 'main' },
    routes: [{ path: '/operations', componentId: 'operations' }],
    marketplace: { show: true, category: 'OperaÃ§Ã£o', price: 'Incluso' },
  },
  {
    id: 'checklists',
    name: 'Checklists Operacionais',
    description: 'CriaÃ§Ã£o e acompanhamento de checklists para padronizaÃ§Ã£o de processos na rede.',
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
    marketplace: { show: true, category: 'OperaÃ§Ã£o', price: 'Incluso' },
  },
  {
    id: 'pendencias',
    name: 'PendÃªncias & Tarefas',
    description: 'GestÃ£o de pendÃªncias crÃ­ticas com atribuiÃ§Ã£o, prazo e acompanhamento.',
    icon: 'AlertCircle',
    status: 'active',
    marketplace: { show: true, category: 'OperaÃ§Ã£o', price: 'Incluso' },
  },
  {
    id: 'diario',
    name: 'DiÃ¡rio de Bordo',
    description: 'Registro diÃ¡rio das operaÃ§Ãµes de cada unidade com histÃ³rico e auditoria.',
    icon: 'BookOpen',
    status: 'active',
    marketplace: { show: true, category: 'OperaÃ§Ã£o', price: 'Incluso' },
  },

  // â”€â”€â”€ Atendimento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'communication-inbox',
    name: 'Central de Conversas',
    description: 'Central de atendimento multicanal com inbox, dashboard, analytics e configuraÃ§Ãµes.',
    icon: 'MessageCircle',
    status: 'active',
    nav: {
      show: true,
      order: 5.1,
      group: 'main',
      children: [
        { label: 'Atendimento', path: '/communication/inbox' },
        { label: 'Dashboard', path: '/communication/dashboard' },
        { label: 'Analytics', path: '/communication/analytics' },
        { label: 'ConfiguraÃ§Ãµes', path: '/communication/settings' },
      ],
    },
    routes: [
      { path: '/communication/inbox', componentId: 'communication-inbox' },
      { path: '/communication/dashboard', componentId: 'communication-dashboard' },
      { path: '/communication/analytics', componentId: 'communication-analytics' },
      { path: '/communication/settings', componentId: 'communication-settings' },
      { path: '/communication/settings/channels', componentId: 'communication-settings-channels' },
      { path: '/communication/settings/departments', componentId: 'communication-settings-departments' },
      { path: '/communication/settings/schedules', componentId: 'communication-settings-schedules' },
      { path: '/communication/settings/distribution', componentId: 'communication-settings-distribution' },
      { path: '/communication/settings/sla', componentId: 'communication-settings-sla' },
      { path: '/communication/settings/tags', componentId: 'communication-settings-tags' },
      { path: '/communication/settings/ai', componentId: 'communication-settings-ai' },
      { path: '/communication/settings/webhooks', componentId: 'communication-settings-webhooks' },
      { path: '/support', componentId: 'communication-inbox', moduleId: 'communication-inbox' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'Atendimento WhatsApp',
    description: 'Central de atendimento multicanal via WhatsApp com distribuiÃ§Ã£o por unidade.',
    icon: 'MessageCircle',
    status: 'available',
    marketplace: { show: true, category: 'Atendimento', price: 'R$ 297/mÃªs' },
    price: 'R$ 297/mÃªs',
  },
  {
    id: 'instagram',
    name: 'Atendimento Instagram',
    description: 'GestÃ£o de mensagens e comentÃ¡rios do Instagram de todas as unidades.',
    icon: 'Instagram',
    status: 'review',
    marketplace: { show: true, category: 'Atendimento', price: 'R$ 197/mÃªs' },
    price: 'R$ 197/mÃªs',
  },

  // â”€â”€â”€ IA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'agente-ia',
    name: 'Agente IA',
    description: 'Assistente inteligente para resposta automÃ¡tica, anÃ¡lise e sugestÃµes operacionais.',
    icon: 'Bot',
    status: 'development',
    marketplace: { show: true, category: 'IA', price: 'Em breve' },
  },

  // â”€â”€â”€ AutomaÃ§Ãµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'automation',
    name: 'AutomaÃ§Ãµes',
    description: 'Motor de regras orientado a eventos e aÃ§Ãµes operacionais.',
    icon: 'Zap',
    status: 'active',
    nav: { show: true, order: 6, group: 'main', children: [
      { label: 'Regras', path: '/automation' },
      { label: 'Todas as regras', path: '/automation/rules' },
    ] },
    routes: [
      { path: '/automation', componentId: 'automation-rules', requiredPermissions: ['tenant.automation.view'] },
      { path: '/automation/rules', componentId: 'automation-rules', requiredPermissions: ['tenant.automation.view'] },
    ],
  },

  // â”€â”€â”€ RelatÃ³rios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'reports',
    name: 'RelatÃ³rios',
    description: 'RelatÃ³rios customizados com exportaÃ§Ã£o e agendamento automÃ¡tico.',
    icon: 'BarChart3',
    status: 'available',
    nav: { show: true, order: 7, group: 'main' },
    routes: [{ path: '/reports', componentId: 'reports' }],
    marketplace: { show: true, category: 'RelatÃ³rios', price: 'R$ 97/mÃªs' },
    price: 'R$ 97/mÃªs',
  },
  // â”€â”€â”€ IntegraÃ§Ãµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'integrations',
    name: 'IntegraÃ§Ãµes',
    description: 'ConexÃ£o com ERPs, gateways de pagamento, plataformas de delivery e mais.',
    icon: 'Plug',
    status: 'available',
    marketplace: { show: true, category: 'IntegraÃ§Ãµes', price: 'Sob consulta' },
    price: 'Sob consulta',
  },

  // â”€â”€â”€ CRM add-ons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'nps',
    name: 'NPS & SatisfaÃ§Ã£o',
    description: 'Pesquisas de satisfaÃ§Ã£o automatizadas e acompanhamento de NPS por unidade.',
    icon: 'Star',
    status: 'development',
    marketplace: { show: true, category: 'Clientes e CRM', price: 'Em breve' },
  },

  // â”€â”€â”€ Insumos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'supply',
    name: 'GestÃ£o de Insumos',
    description: 'Controle de estoque, pedidos de reposiÃ§Ã£o e centralizaÃ§Ã£o de compras.',
    icon: 'Boxes',
    status: 'blocked',
    marketplace: { show: true, category: 'OperaÃ§Ã£o', price: 'Sob consulta' },
    plan: 'enterprise',
  },

  // â”€â”€â”€ System modules (always visible, not in marketplace) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'marketplace',
    name: 'MÃ³dulos',
    description: 'Central de mÃ³dulos â€” ative, solicite e gerencie os mÃ³dulos da plataforma.',
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
    description: 'GestÃ£o de usuÃ¡rios, perfis de permissÃ£o e solicitaÃ§Ãµes de acesso.',
    icon: 'Shield',
    status: 'active',
    nav: {
      show: true,
      order: 9,
      group: 'system',
      children: [
        { label: 'Usuarios', path: '/users' },
        { label: 'Perfis', path: '/access' },
        { label: 'PermissÃµes', path: '/access/permissions' },
        { label: 'SolicitaÃ§Ãµes', path: '/access/requests', badge: 3 },
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
    id: 'network_operations_center',
    name: 'NOC',
    description: 'Central executiva de monitoramento e priorizaÃ§Ã£o da saÃºde da rede.',
    icon: 'Activity',
    status: 'active',
    nav: {
      show: true,
      order: 8.5,
      group: 'system',
      children: [
        { label: 'VisÃ£o Geral', path: '/noc' },
        { label: 'Alertas', path: '/noc/alerts' },
        { label: 'Ranking de Unidades', path: '/noc/units' },
      ],
    },
    routes: [
      { path: '/noc', componentId: 'noc-dashboard', moduleId: 'noc', requiredPermissions: ['tenant.noc.view'] },
      { path: '/noc/alerts', componentId: 'noc-alerts', moduleId: 'noc', requiredPermissions: ['tenant.noc.view'] },
      { path: '/noc/units', componentId: 'noc-units', moduleId: 'noc', requiredPermissions: ['tenant.noc.view'] },
      { path: '/noc/unit/:id', componentId: 'noc-unit-detail', moduleId: 'noc', requiredPermissions: ['tenant.noc.view'] },
    ],
  },

  {
    id: 'tasks',
    name: 'Central de AÃ§Ãµes',
    description: 'Tarefas manuais e automÃ¡ticas priorizadas.',
    icon: 'ListTodo',
    status: 'active',
    nav: { show: true, order: 8.7, group: 'system' },
    routes: [
      { path: '/tasks', componentId: 'tasks-list', requiredPermissions: ['tenant.tasks.view'] },
      { path: '/tasks/:id', componentId: 'task-detail', requiredPermissions: ['tenant.tasks.view'] },
    ],
  },

  {
    id: 'analytics',
    name: 'Analytics Executivo',
    description: 'Dashboards dinÃ¢micos, templates corporativos e indicadores da rede.',
    icon: 'LayoutDashboard',
    status: 'active',
    nav: {
      show: true,
      order: 13,
      group: 'system',
      children: [
        { label: 'Meu Dashboard', path: '/analytics' },
        { label: 'Templates', path: '/analytics/templates' },
        { label: 'CatÃ¡logo', path: '/analytics/catalog' },
      ],
    },
    routes: [
      { path: '/analytics', componentId: 'analytics-dashboard', requiredPermissions: ['tenant.analytics.view'] },
      { path: '/analytics/edit', componentId: 'analytics-dashboard', requiredPermissions: ['tenant.analytics.update'] },
      { path: '/analytics/templates', componentId: 'analytics-templates', requiredPermissions: ['tenant.analytics.templates.view'] },
      { path: '/analytics/templates/:id', componentId: 'analytics-template-detail', requiredPermissions: ['tenant.analytics.templates.view'] },
      { path: '/analytics/catalog', componentId: 'analytics-catalog', requiredPermissions: ['tenant.analytics.templates.view'] },
    ],
    marketplace: { show: true, category: 'Analytics', price: 'Incluso' },
  },

  {
    id: 'settings',
    name: 'ConfiguraÃ§Ãµes',
    description: 'ConfiguraÃ§Ãµes gerais, white label, menu e seguranÃ§a da plataforma.',
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

  // â”€â”€â”€ Form Builder (Metadata Engine) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  {
    id: 'form-builder',
    name: 'Form Builder',
    description: 'Metadata Engine â€” configure campos, formulÃ¡rios e estrutura de dados de toda a plataforma sem escrever cÃ³digo.',
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

// â”€â”€â”€ Registry helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  return MODULE_REGISTRY.find(m => m.id === (LEGACY_MODULE_ID_ALIASES[id] ?? id));
}

const LEGACY_MODULE_ID_ALIASES: Record<string, string> = {
  automacoes: 'automations',
  relatorios: 'reports',
  integracoes: 'integrations',
  communication: 'communication-inbox',
  support: 'communication-inbox',
  noc: 'network_operations_center',
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


