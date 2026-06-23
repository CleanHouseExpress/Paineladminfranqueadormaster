import { expect, Page } from '@playwright/test';
import { ids } from './selectors';

const completedOnboardingState = {
  wizardStarted: true,
  wizardCompleted: true,
  wizardOpen: false,
  currentWizardStep: 8,
  stepData: {
    network: { networkName: 'Orchestra E2E', segment: 'Homologacao', email: 'e2e@orchestra.com', city: 'Sao Paulo', state: 'SP', cnpj: '' },
    whitelabel: { platformName: 'Orchestra', primaryColor: '#6366F1', secondaryColor: '#8B5CF6' },
    units: [{ id: 'centro', name: 'Centro', city: 'Sao Paulo', state: 'SP', manager: 'Admin Centro' }],
    users: [{ id: 'admin-centro', email: 'admin.centro@orchestra.com', role: 'franchise_admin' }],
    modules: ['dashboard', 'units', 'clients', 'crm', 'sales', 'financial', 'cashflow', 'dre', 'cmv', 'royalties', 'inventory', 'checklists', 'operations', 'automation', 'tasks', 'noc', 'analytics', 'access', 'settings'],
    financial: { royaltyRate: 5, adFundRate: 0, billingDay: 15, graceDays: 5 },
    clientsImported: true,
  },
  tourCompleted: true,
  tourActive: false,
  currentTourStop: 0,
  checklist: [
    { id: 'network', label: 'Configurar dados da rede', description: 'Nome, segmento e contatos', path: '/settings', completed: true },
    { id: 'whitelabel', label: 'Definir identidade visual', description: 'Cores e nome da plataforma', path: '/settings/whitelabel', completed: true },
    { id: 'unit', label: 'Cadastrar primeira unidade', description: 'Adicione ao menos uma unidade', path: '/units', completed: true },
    { id: 'user', label: 'Convidar colaborador', description: 'Gestores, admin ou operadores', path: '/access', completed: true },
    { id: 'modules', label: 'Ativar modulos da rede', description: 'Escolha as funcionalidades ativas', path: '/modules', completed: true },
    { id: 'royalties', label: 'Configurar royalties', description: 'Taxas e vencimentos por unidade', path: '/financial/royalties', completed: true },
    { id: 'clients', label: 'Importar base de clientes', description: 'CSV ou cadastro manual', path: '/clients', completed: true },
    { id: 'tour', label: 'Fazer tour pela plataforma', description: 'Conheca todos os recursos', path: '/', completed: true },
  ],
  lastSynced: new Date(0).toISOString(),
};

export async function disableOnboarding(page: Page) {
  await page.addInitScript(state => {
    window.localStorage.setItem('orchestra_onboarding_v1', JSON.stringify(state));
  }, completedOnboardingState);
}

export async function login(page: Page, credentials: { email: string; password: string }) {
  await disableOnboarding(page);
  await page.goto('/login');
  await page.getByTestId(ids.loginEmail).fill(credentials.email);
  await page.getByTestId(ids.loginPassword).fill(credentials.password);
  await page.getByTestId(ids.loginSubmit).click();
  await expect(page).not.toHaveURL(/\/login$/);
  await page.waitForFunction(() => Boolean(window.localStorage.getItem('orchestra_auth_token')));
  await expect(page.getByTestId(ids.sidebar)).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByTestId(ids.logout).click({ force: true });
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
}
