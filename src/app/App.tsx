import { BrowserRouter, Routes, Route } from 'react-router';
import type { ComponentType } from 'react';

import { AppProvider } from '../shared/context/AppProvider';
import { Layout } from './components/Layout';
import { PlaceholderPage } from './components/PlaceholderPage';
import { ALL_ROUTES } from '../services/moduleRegistry';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ProductTour } from './components/onboarding/ProductTour';

// ─── Module pages ─────────────────────────────────────────────────────────────
import { DashboardPage } from '../modules/dashboard';
import { ClientsPage } from '../modules/clients';
import {
  FinancialOverviewPage, CashFlowPage, DREPage, CMVPage, RoyaltiesPage,
} from '../modules/financial';
import {
  MarketplacePage, ModuleDetailPage, RequestModuleAccessPage, RequestNewModulePage,
} from '../modules/marketplace';
import { AccessPermissionsPage, AccessRequestsPage } from '../modules/access';
import { GeneralSettingsPage, MenuConfigPage, WhiteLabelPage } from '../modules/settings';
import {
  EntityCatalogPage, FieldManagementPage, FormOrganizerPage,
  ChangeHistoryPage, VersionManagerPage,
} from '../modules/form-builder';
import {
  ChecklistDashboardPage, ChecklistTemplatesPage, ChecklistTemplateFormPage,
  ChecklistExecutionsPage, ChecklistExecutionPage,
} from '../modules/checklists';

// ─── Component map ────────────────────────────────────────────────────────────
// Maps componentId strings from moduleRegistry to actual React components.
// Only this map changes when adding a new page — no other files need updating.

const COMPONENT_MAP: Record<string, ComponentType> = {
  'dashboard':             DashboardPage,
  'units':                 () => <PlaceholderPage title="Gestão de Unidades" description="Cadastro, monitoramento e controle de todas as unidades da rede em um único painel." />,
  'clients':               ClientsPage,
  'financial-overview':    FinancialOverviewPage,
  'cashflow':              CashFlowPage,
  'dre':                   DREPage,
  'cmv':                   CMVPage,
  'royalties':             RoyaltiesPage,
  'operations':            () => <PlaceholderPage title="Operação" description="Checklists, pendências e diário de bordo para gestão operacional da rede." />,
  'support':               () => <PlaceholderPage title="Atendimento" description="Central de atendimento multicanal. Ative o módulo WhatsApp ou Instagram para começar." />,
  'automations':           () => <PlaceholderPage title="Automações" description="Fluxos automatizados para notificações, cobranças e processos repetitivos." />,
  'reports':               () => <PlaceholderPage title="Relatórios" description="Relatórios customizados com exportação e agendamento automático." />,
  'marketplace':           MarketplacePage,
  'module-detail':         ModuleDetailPage,
  'request-module-access': RequestModuleAccessPage,
  'request-new-module':    RequestNewModulePage,
  'access-permissions':    AccessPermissionsPage,
  'access-requests':       AccessRequestsPage,
  'settings':              GeneralSettingsPage,
  'menu-config':           MenuConfigPage,
  'white-label':           WhiteLabelPage,
  'settings-placeholder':  () => <PlaceholderPage title="Em breve" description="Esta seção estará disponível em breve." />,
  // Checklists Operacionais (Core module)
  'checklists-dashboard':     ChecklistDashboardPage,
  'checklists-templates':     ChecklistTemplatesPage,
  'checklists-template-form': ChecklistTemplateFormPage,
  'checklists-executions':    ChecklistExecutionsPage,
  'checklists-execution':     ChecklistExecutionPage,
  // Form Builder (Metadata Engine)
  'form-builder-catalog':   EntityCatalogPage,
  'form-builder-fields':    FieldManagementPage,
  'form-builder-organizer': FormOrganizerPage,
  'form-builder-history':   ChangeHistoryPage,
  'form-builder-versions':  VersionManagerPage,
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <OnboardingWizard />
        <ProductTour />
        <Layout>
          <Routes>
            {/* Routes generated dynamically from the Module Registry */}
            {ALL_ROUTES.map(route => {
              const PageComponent = COMPONENT_MAP[route.componentId];
              if (!PageComponent) return null;
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<PageComponent />}
                />
              );
            })}
            <Route
              path="*"
              element={<PlaceholderPage title="Página não encontrada" description="A rota que você acessou não existe." />}
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
