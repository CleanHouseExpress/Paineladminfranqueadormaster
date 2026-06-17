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
        { label: 'Fluxo de Caixa', path: '/financial/cashflow' },
        { label: 'DRE Gerencial', path: '/financial/dre' },
        { label: 'CMV & Custos', path: '/financial/cmv' },
        { label: 'Royalties', path: '/financial/royalties' },
      ],
    },
    routes: [
      { path: '/financial', componentId: 'financial-overview' },
      { path: '/financial/cashflow', componentId: 'cashflow' },
      { path: '/financial/dre', componentId: 'dre' },
      { path: '/financial/cmv', componentId: 'cmv' },
      { path: '/financial/royalties', componentId: 'royalties' },
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
    name: 'CMV & Custos',
    description: 'Controle de custo de mercadoria vendida e análise de margem por produto.',
    icon: 'Package',
    status: 'active',
    marketplace: { show: true, category: 'Financeiro', price: 'Incluso' },
  },
  {
    id: 'royalties',
    name: 'Royalties',
    description: 'Cálculo, cobrança e controle de royalties e taxas de franquia por unidade.',
    icon: 'Receipt',
    status: 'active',
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

  {
    id: 'supply',
    name: 'Gestão de Insumos',
    description: 'Controle de estoque, pedidos de reposição e centralização de compras.',
    icon: 'Boxes',
    status: 'blocked',
    marketplace: { show: true, category: 'Operação', price: 'Sob consulta' },
    plan: 'enterprise',
  },

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
    moduleId: m.id,
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
