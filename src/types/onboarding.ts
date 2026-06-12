// ─── Wizard ────────────────────────────────────────────────────────────────────

export type WizardStepId =
  | 'network'
  | 'whitelabel'
  | 'settings'
  | 'review';

export interface WizardStep {
  id: WizardStepId;
  title: string;
  subtitle: string;
  /** Whether the user can skip without filling it in */
  skippable: boolean;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 'network',    title: 'Dados da rede',            subtitle: 'Informações básicas da franqueadora',  skippable: false },
  { id: 'whitelabel', title: 'Identidade visual',        subtitle: 'Personalize a plataforma',             skippable: true  },
  { id: 'settings',   title: 'Configurações da rede',    subtitle: 'Ajuste o comportamento operacional',   skippable: false },
  { id: 'review',     title: 'Revisão final',            subtitle: 'Tudo pronto para lançar!',             skippable: false },
];

// ─── Step form data ────────────────────────────────────────────────────────────

export interface NetworkStepData {
  networkName: string;
  segment: string;
  cnpj: string;
  email: string;
  city: string;
  state: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
}

export interface WhiteLabelStepData {
  platformName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface UnitEntry {
  id: string;
  name: string;
  city: string;
  state: string;
  manager: string;
}

export interface UserInvite {
  id: string;
  email: string;
  role: string;
}

export interface FinancialStepData {
  royaltyRate: number;
  adFundRate: number;
  billingDay: number;
  graceDays: number;
}

export interface TenantSettingsStepData {
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  decimalSeparator: string;
  thousandSeparator: string;
  weekStartsOn: string;
  defaultCountry: string;
  defaultState: string;
  defaultCity: string;
  networkType: string;
  unitManagementMode: string;
  emailNotifications: boolean;
  systemNotifications: boolean;
  criticalAlerts: boolean;
  dashboardPreferences: Record<string, unknown>;
}

export type WizardStepData = {
  network: Partial<NetworkStepData>;
  whitelabel: Partial<WhiteLabelStepData>;
  units: UnitEntry[];
  users: UserInvite[];
  modules: string[];
  financial: Partial<FinancialStepData>;
  clientsImported: boolean;
  settings: Partial<TenantSettingsStepData>;
};

// ─── Tour ─────────────────────────────────────────────────────────────────────

export interface TourStop {
  id: string;
  /** data-tour attribute value to target */
  target: string;
  title: string;
  description: string;
  position: 'top' | 'right' | 'bottom' | 'left';
}

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'dashboard',
    target: 'dashboard-metrics',
    title: 'Painel Executivo',
    description: 'Aqui você vê os principais indicadores da sua rede em tempo real: faturamento, unidades, clientes e alertas.',
    position: 'bottom',
  },
  {
    id: 'sidebar',
    target: 'sidebar-nav',
    title: 'Navegação da plataforma',
    description: 'O menu lateral dá acesso a todos os módulos. Itens esmaecidos são módulos disponíveis que ainda não foram ativados.',
    position: 'right',
  },
  {
    id: 'financial',
    target: 'nav-financial',
    title: 'Módulo Financeiro',
    description: 'Gerencie fluxo de caixa, DRE, CMV e royalties da rede. Tudo consolidado por unidade ou para a rede toda.',
    position: 'right',
  },
  {
    id: 'modules',
    target: 'nav-modules',
    title: 'Central de Módulos',
    description: 'Ative novos módulos para expandir as funcionalidades da plataforma. Cada módulo pode ser habilitado por unidade.',
    position: 'right',
  },
  {
    id: 'access',
    target: 'nav-access',
    title: 'Acessos e Permissões',
    description: 'Gerencie quem acessa o quê. Crie perfis customizados e aprove solicitações de acesso de gestores e operadores.',
    position: 'right',
  },
  {
    id: 'settings',
    target: 'nav-settings',
    title: 'Configurações',
    description: 'Personalize white label, menu, notificações e segurança. Cada franqueadora tem sua própria identidade na plataforma.',
    position: 'right',
  },
];

// ─── Checklist ─────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  path: string;
  completed: boolean;
  requiredModuleIds?: string[];
}

export const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'network',    label: 'Configurar dados da rede',       description: 'Nome, segmento e contatos',        path: '/settings',           completed: false },
  { id: 'whitelabel', label: 'Definir identidade visual',      description: 'Cores e nome da plataforma',       path: '/settings/whitelabel',completed: false },
  { id: 'unit',       label: 'Cadastrar primeira unidade',     description: 'Adicione ao menos uma unidade',    path: '/units',              completed: false },
  { id: 'user',       label: 'Convidar colaborador',           description: 'Gestores, admin ou operadores',    path: '/access',             completed: false },
  { id: 'modules',    label: 'Ativar módulos da rede',         description: 'Escolha as funcionalidades ativas',path: '/modules',            completed: false },
  { id: 'royalties',  label: 'Configurar royalties',           description: 'Taxas e vencimentos por unidade',  path: '/financial/royalties',completed: false },
  { id: 'clients',    label: 'Importar base de clientes',      description: 'CSV ou cadastro manual',           path: '/clients',            completed: false },
  { id: 'tour',       label: 'Fazer tour pela plataforma',     description: 'Conheça todos os recursos',        path: '/',                   completed: false },
];

// ─── Master state ──────────────────────────────────────────────────────────────

export interface OnboardingState {
  /** Wizard not yet started = first access */
  wizardStarted: boolean;
  wizardCompleted: boolean;
  currentWizardStep: number;
  stepData: WizardStepData;

  tourCompleted: boolean;
  tourActive: boolean;
  currentTourStop: number;

  checklist: ChecklistItem[];

  lastSynced: string | null;
}

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  wizardStarted: false,
  wizardCompleted: false,
  currentWizardStep: 0,
  stepData: {
    network: {
      networkName: 'Bella Vita Franchising',
      segment: 'Beleza e Estética',
      email: 'contato@bellavita.com.br',
      city: 'São Paulo',
      state: 'SP',
      cnpj: '',
      responsibleName: '',
      responsibleEmail: '',
      responsiblePhone: '',
    },
    whitelabel: { platformName: 'Orchestra', primaryColor: '#6366F1', secondaryColor: '#8B5CF6' },
    units: [],
    users: [],
    modules: ['dashboard', 'units', 'clients', 'financial', 'cashflow', 'dre', 'cmv', 'royalties', 'operations', 'access', 'settings'],
    financial: { royaltyRate: 7, adFundRate: 2, billingDay: 15, graceDays: 5 },
    clientsImported: false,
    settings: {
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      decimalSeparator: ',',
      thousandSeparator: '.',
      weekStartsOn: 'monday',
      defaultCountry: 'Brasil',
      defaultState: '',
      defaultCity: '',
      networkType: 'franchise',
      unitManagementMode: 'centralized',
      emailNotifications: true,
      systemNotifications: true,
      criticalAlerts: true,
      dashboardPreferences: {},
    },
  },
  tourCompleted: false,
  tourActive: false,
  currentTourStop: 0,
  checklist: INITIAL_CHECKLIST,
  lastSynced: null,
};
