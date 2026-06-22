import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppProvider } from '../shared/context/AppProvider';
import { ModuleGate } from '../shared/components/ModuleGate';
import { PermissionGate } from '../shared/components/PermissionGate';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { ALL_ROUTES } from '../services/moduleRegistry';
import { AccessPermissionsPage, AccessRequestsPage } from '../modules/access';
import { ChecklistExecutionPage, ChecklistExecutionsPage, ChecklistTemplateFormPage, ChecklistTemplatesPage, ChecklistsDashboardPage } from '../modules/checklists';
import { CustomerFormPage, CustomerSettingsPage, CustomersListPage } from '../modules/clients';
import { DashboardPage } from '../modules/dashboard';
import { DocumentCategoriesPage, DocumentDetailPage, DocumentFormPage, DocumentListPage, DocumentSettingsPage } from '../modules/documents';
import { ContractDetailPage, ContractFormPage, ContractListPage, ContractSettingsPage } from '../modules/contracts';
import { TrainingDetailPage, TrainingFormPage, TrainingListPage, TrainingSettingsPage } from '../modules/trainings';
import { CatalogDetailPage, CatalogFormPage, CatalogListPage, CatalogSettingsPage } from '../modules/catalog';
import { GeneralSettingsPage, MenuConfigPage, WhiteLabelPage } from '../modules/settings';
import { UserFormPage, UsersListPage } from '../modules/users';
import { UnitFormPage, UnitSettingsPage, UnitsListPage } from '../modules/units';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { PlaceholderPage } from './components/PlaceholderPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ProductTour } from './components/onboarding/ProductTour';
import { FranchisePortalLayout, FranchisePortalRoutes } from '../modules/franchise';
import { FranchisePortalProvider } from '../shared/context/FranchisePortalContext';
import { useAuth } from '../shared/context/AuthContext';

function lazyPage<T extends Record<string, ComponentType>>(
  loader: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(async () => ({ default: (await loader())[exportName] }));
}

const FinancialOverviewPage = lazyPage(() => import('./components/FinancialOverview'), 'FinancialOverview');
const CashFlowPage = lazyPage(() => import('./components/CashFlow'), 'CashFlow');
const DREPage = lazyPage(() => import('./components/DRE'), 'DRE');
const CMVPage = lazyPage(() => import('./components/CMV'), 'CMV');
const RoyaltiesPage = lazyPage(() => import('./components/Royalties'), 'Royalties');

const MarketplacePage = lazyPage(() => import('./components/ModulesMarketplace'), 'ModulesMarketplace');
const ModuleDetailPage = lazyPage(() => import('./components/ModuleDetail'), 'ModuleDetail');
const RequestModuleAccessPage = lazyPage(() => import('./components/RequestModuleAccess'), 'RequestModuleAccess');
const RequestNewModulePage = lazyPage(() => import('./components/RequestNewModule'), 'RequestNewModule');

const EntityCatalogPage = lazyPage(() => import('./components/form-builder/EntityCatalog'), 'EntityCatalog');
const FieldManagementPage = lazyPage(() => import('./components/form-builder/FieldManagement'), 'FieldManagement');
const FormOrganizerPage = lazyPage(() => import('./components/form-builder/FormOrganizer'), 'FormOrganizer');
const ChangeHistoryPage = lazyPage(() => import('./components/form-builder/ChangeHistory'), 'ChangeHistory');
const VersionManagerPage = lazyPage(() => import('./components/form-builder/VersionManager'), 'VersionManager');

const COMPONENT_MAP: Record<string, ComponentType> = {
  dashboard: DashboardPage,
  units: UnitsListPage,
  'unit-new': UnitFormPage,
  'unit-detail': UnitFormPage,
  'unit-settings': UnitSettingsPage,
  customers: CustomersListPage,
  'customer-new': CustomerFormPage,
  'customer-detail': CustomerFormPage,
  'customer-settings': CustomerSettingsPage,
  'financial-overview': FinancialOverviewPage,
  cashflow: CashFlowPage,
  dre: DREPage,
  cmv: CMVPage,
  royalties: RoyaltiesPage,
  operations: () => <PlaceholderPage title="Operacao" description="Checklists, pendencias e diario de bordo para gestao operacional da rede." />,
  checklists: ChecklistsDashboardPage,
  'checklist-templates': ChecklistTemplatesPage,
  'checklist-template-new': ChecklistTemplateFormPage,
  'checklist-template-detail': ChecklistTemplateFormPage,
  'checklist-executions': ChecklistExecutionsPage,
  'checklist-execution-detail': ChecklistExecutionPage,
  'documents-list': DocumentListPage,
  'documents-form': DocumentFormPage,
  'documents-detail': DocumentDetailPage,
  'documents-categories': DocumentCategoriesPage,
  'documents-settings': DocumentSettingsPage,
  'contracts-list': ContractListPage,
  'contracts-form': ContractFormPage,
  'contracts-detail': ContractDetailPage,
  'contracts-settings': ContractSettingsPage,
  'trainings-list': TrainingListPage,
  'trainings-form': TrainingFormPage,
  'trainings-detail': TrainingDetailPage,
  'trainings-settings': TrainingSettingsPage,
  'catalog-list': CatalogListPage,
  'catalog-form': CatalogFormPage,
  'catalog-detail': CatalogDetailPage,
  'catalog-settings': CatalogSettingsPage,
  support: () => <PlaceholderPage title="Atendimento" description="Central de atendimento multicanal. Ative o modulo WhatsApp ou Instagram para comecar." />,
  automations: () => <PlaceholderPage title="Automacoes" description="Fluxos automatizados para notificacoes, cobrancas e processos repetitivos." />,
  reports: () => <PlaceholderPage title="Relatorios" description="Relatorios customizados com exportacao e agendamento automatico." />,
  marketplace: MarketplacePage,
  'module-detail': ModuleDetailPage,
  'request-module-access': RequestModuleAccessPage,
  'request-new-module': RequestNewModulePage,
  'access-permissions': AccessPermissionsPage,
  'access-requests': AccessRequestsPage,
  users: UsersListPage,
  'user-new': UserFormPage,
  'user-detail': UserFormPage,
  settings: GeneralSettingsPage,
  'menu-config': MenuConfigPage,
  'white-label': WhiteLabelPage,
  'settings-placeholder': () => <PlaceholderPage title="Em breve" description="Esta secao estara disponivel em breve." />,
  'form-builder-catalog': EntityCatalogPage,
  'form-builder-fields': FieldManagementPage,
  'form-builder-organizer': FormOrganizerPage,
  'form-builder-history': ChangeHistoryPage,
  'form-builder-versions': VersionManagerPage,
};

function ProtectedAppRoutes() {
  const { user, isLoading } = useAuth();
  if (!isLoading && user?.role === 'franchise_admin') {
    return <Navigate to="/franchise/dashboard" replace />;
  }

  return (
    <ProtectedRoute>
      <OnboardingWizard />
      <ProductTour />
      <Layout>
        <Suspense fallback={null}>
          <Routes>
            {ALL_ROUTES.map(route => {
              const PageComponent = COMPONENT_MAP[route.componentId];
              if (!PageComponent) return null;
              const page = (
                <ModuleGate moduleId={route.moduleId ?? route.componentId}>
                  <PermissionGate permissions={route.requiredPermissions ?? []}>
                    <PageComponent />
                  </PermissionGate>
                </ModuleGate>
              );
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={page}
                />
              );
            })}
            <Route
              path="*"
              element={<PlaceholderPage title="Pagina nao encontrada" description="A rota que voce acessou nao existe." />}
            />
          </Routes>
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

function ProtectedFranchiseRoutes() {
  return (
    <ProtectedRoute>
      <FranchisePortalProvider>
        <FranchisePortalLayout>
          <Suspense fallback={null}>
            <FranchisePortalRoutes />
          </Suspense>
        </FranchisePortalLayout>
      </FranchisePortalProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/franchise/*" element={<ProtectedFranchiseRoutes />} />
          <Route path="/*" element={<ProtectedAppRoutes />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
