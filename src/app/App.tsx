import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppProvider } from '../shared/context/AppProvider';
import { ModuleGate } from '../shared/components/ModuleGate';
import { PermissionGate } from '../shared/components/PermissionGate';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { ALL_ROUTES } from '../services/moduleRegistry';
import { AccessPermissionsPage, AccessRequestsPage } from '../modules/access';
import { CustomerFormPage, CustomerSettingsPage, CustomersListPage } from '../modules/clients';
import { DashboardPage } from '../modules/dashboard';
import { GeneralSettingsPage, MenuConfigPage, WhiteLabelPage } from '../modules/settings';
import { UserFormPage, UsersListPage } from '../modules/users';
import { UnitFormPage, UnitSettingsPage, UnitsListPage } from '../modules/units';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { PlaceholderPage } from './components/PlaceholderPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ProductTour } from './components/onboarding/ProductTour';
import { FranchisePortalProvider } from '../shared/context/FranchisePortalContext';
import { useAuth } from '../shared/context/AuthContext';

function lazyPage<T extends Record<string, ComponentType>>(
  loader: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(async () => ({ default: (await loader())[exportName] }));
}

const FinancialOverviewPage = lazyPage(() => import('./components/FinancialOverview'), 'FinancialOverview');
const FinancialTransactionsPage = lazyPage(() => import('./components/financial/FinancialManagement'), 'FinancialTransactions');
const FinancialAccountsPage = lazyPage(() => import('./components/financial/FinancialManagement'), 'FinancialAccounts');
const CashFlowPage = lazyPage(() => import('./components/CashFlow'), 'CashFlow');
const DREPage = lazyPage(() => import('./components/DRE'), 'DRE');
const CMVPage = lazyPage(() => import('./components/CMV'), 'CMV');
const RoyaltiesPage = lazyPage(() => import('./components/Royalties'), 'RoyaltyDashboard');
const RoyaltyRulesPage = lazyPage(() => import('./components/Royalties'), 'RoyaltyRules');
const RoyaltyCalculationsPage = lazyPage(() => import('./components/Royalties'), 'RoyaltyCalculations');
const RoyaltySettingsPage = lazyPage(() => import('./components/Royalties'), 'RoyaltySettings');

const InventoryDashboard = lazyPage(() => import('../modules/inventory'), 'InventoryDashboard');
const InventoryItems = lazyPage(() => import('../modules/inventory'), 'InventoryItems');
const InventoryItemForm = lazyPage(() => import('../modules/inventory'), 'InventoryItemForm');
const InventoryItemDetail = lazyPage(() => import('../modules/inventory'), 'InventoryItemDetail');
const InventoryCategories = lazyPage(() => import('../modules/inventory'), 'InventoryCategories');
const InventorySuppliers = lazyPage(() => import('../modules/inventory'), 'InventorySuppliers');
const InventoryMovements = lazyPage(() => import('../modules/inventory'), 'InventoryMovements');
const InventorySettings = lazyPage(() => import('../modules/inventory'), 'InventorySettings');

const CrmDashboardPage = lazyPage(() => import('../modules/crm'), 'CrmDashboardPage');
const CrmKanbanPage = lazyPage(() => import('../modules/crm'), 'CrmKanbanPage');
const CrmLeadsPage = lazyPage(() => import('../modules/crm'), 'CrmLeadsPage');
const CrmLeadFormPage = lazyPage(() => import('../modules/crm'), 'CrmLeadFormPage');
const CrmLeadDetailPage = lazyPage(() => import('../modules/crm'), 'CrmLeadDetailPage');
const CrmPipelinesPage = lazyPage(() => import('../modules/crm'), 'CrmPipelinesPage');
const CrmSettingsPage = lazyPage(() => import('../modules/crm'), 'CrmSettingsPage');

const AnalyticsDashboardPage = lazyPage(() => import('../modules/analytics'), 'AnalyticsDashboardPage');
const FranchisePortalLayout = lazyPage(() => import('../modules/franchise'), 'FranchisePortalLayout');
const FranchisePortalRoutes = lazyPage(() => import('../modules/franchise'), 'FranchisePortalRoutes');

const ChecklistsDashboardPage = lazyPage(() => import('../modules/checklists'), 'ChecklistsDashboardPage');
const ChecklistTemplatesPage = lazyPage(() => import('../modules/checklists'), 'ChecklistTemplatesPage');
const ChecklistTemplateFormPage = lazyPage(() => import('../modules/checklists'), 'ChecklistTemplateFormPage');
const ChecklistExecutionsPage = lazyPage(() => import('../modules/checklists'), 'ChecklistExecutionsPage');
const ChecklistExecutionPage = lazyPage(() => import('../modules/checklists'), 'ChecklistExecutionPage');

const DocumentListPage = lazyPage(() => import('../modules/documents'), 'DocumentListPage');
const DocumentFormPage = lazyPage(() => import('../modules/documents'), 'DocumentFormPage');
const DocumentDetailPage = lazyPage(() => import('../modules/documents'), 'DocumentDetailPage');
const DocumentCategoriesPage = lazyPage(() => import('../modules/documents'), 'DocumentCategoriesPage');
const DocumentSettingsPage = lazyPage(() => import('../modules/documents'), 'DocumentSettingsPage');

const ContractListPage = lazyPage(() => import('../modules/contracts'), 'ContractListPage');
const ContractFormPage = lazyPage(() => import('../modules/contracts'), 'ContractFormPage');
const ContractDetailPage = lazyPage(() => import('../modules/contracts'), 'ContractDetailPage');
const ContractSettingsPage = lazyPage(() => import('../modules/contracts'), 'ContractSettingsPage');

const TrainingListPage = lazyPage(() => import('../modules/trainings'), 'TrainingListPage');
const TrainingFormPage = lazyPage(() => import('../modules/trainings'), 'TrainingFormPage');
const TrainingDetailPage = lazyPage(() => import('../modules/trainings'), 'TrainingDetailPage');
const TrainingSettingsPage = lazyPage(() => import('../modules/trainings'), 'TrainingSettingsPage');

const CatalogListPage = lazyPage(() => import('../modules/catalog'), 'CatalogListPage');
const CatalogFormPage = lazyPage(() => import('../modules/catalog'), 'CatalogFormPage');
const CatalogDetailPage = lazyPage(() => import('../modules/catalog'), 'CatalogDetailPage');
const CatalogSettingsPage = lazyPage(() => import('../modules/catalog'), 'CatalogSettingsPage');

const CMVDashboardPage = lazyPage(() => import('../modules/cmv'), 'CMVDashboardPage');
const CMVByItemPage = lazyPage(() => import('../modules/cmv'), 'CMVByItemPage');
const CMVByUnitPage = lazyPage(() => import('../modules/cmv'), 'CMVByUnitPage');
const CMVByOriginPage = lazyPage(() => import('../modules/cmv'), 'CMVByOriginPage');

const SalesListPage = lazyPage(() => import('../modules/sales'), 'SalesListPage');
const SalesFormPage = lazyPage(() => import('../modules/sales'), 'SalesFormPage');
const SalesDetailPage = lazyPage(() => import('../modules/sales'), 'SalesDetailPage');
const SalesSettingsPage = lazyPage(() => import('../modules/sales'), 'SalesSettingsPage');

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
  'financial-transactions': FinancialTransactionsPage,
  'financial-accounts': FinancialAccountsPage,
  cashflow: CashFlowPage,
  dre: DREPage,
  cmv: CMVPage,
  royalties: RoyaltiesPage,
  'royalty-rules': RoyaltyRulesPage,
  'royalty-calculations': RoyaltyCalculationsPage,
  'royalty-settings': RoyaltySettingsPage,
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
  'inventory-dashboard': InventoryDashboard,
  'inventory-items': InventoryItems,
  'inventory-item-form': InventoryItemForm,
  'inventory-item-detail': InventoryItemDetail,
  'inventory-categories': InventoryCategories,
  'inventory-suppliers': InventorySuppliers,
  'inventory-movements': InventoryMovements,
  'inventory-settings': InventorySettings,
  'cmv-dashboard': CMVDashboardPage,
  'cmv-by-item': CMVByItemPage,
  'cmv-by-unit': CMVByUnitPage,
  'cmv-by-origin': CMVByOriginPage,
  'sales-list': SalesListPage,
  'sales-form': SalesFormPage,
  'sales-detail': SalesDetailPage,
  'sales-settings': SalesSettingsPage,
  'crm-dashboard': CrmDashboardPage,
  'crm-kanban': CrmKanbanPage,
  'crm-leads': CrmLeadsPage,
  'crm-lead-form': CrmLeadFormPage,
  'crm-lead-detail': CrmLeadDetailPage,
  'crm-pipelines': CrmPipelinesPage,
  'crm-settings': CrmSettingsPage,
  'analytics-dashboard': AnalyticsDashboardPage,
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
      <Suspense fallback={null}>
        <FranchisePortalProvider>
          <FranchisePortalLayout>
            <FranchisePortalRoutes />
          </FranchisePortalLayout>
        </FranchisePortalProvider>
      </Suspense>
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
