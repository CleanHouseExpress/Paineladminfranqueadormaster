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
const RoyaltiesPage = lazyPage(() => import('./components/Royalties'), 'Royalties');
const DreGoalsPage = lazyPage(() => import('./components/financial/FinancialGovernancePages'), 'DreGoalsPage');
const DreHistoryPage = lazyPage(() => import('./components/financial/FinancialGovernancePages'), 'DreHistoryPage');
const DreProjectionPage = lazyPage(() => import('./components/financial/FinancialGovernancePages'), 'DreProjectionPage');
const RoyaltyPeriodsPage = lazyPage(() => import('./components/financial/FinancialGovernancePages'), 'RoyaltyPeriodsPage');
const CrmDashboardPage = lazyPage(() => import('../modules/crm'), 'CrmDashboardPage');
const CrmKanbanPage = lazyPage(() => import('../modules/crm'), 'CrmKanbanPage');
const CrmLeadsPage = lazyPage(() => import('../modules/crm'), 'CrmLeadsPage');
const CrmLeadFormPage = lazyPage(() => import('../modules/crm'), 'CrmLeadFormPage');
const CrmLeadDetailPage = lazyPage(() => import('../modules/crm'), 'CrmLeadDetailPage');
const CrmPipelinesPage = lazyPage(() => import('../modules/crm'), 'CrmPipelinesPage');
const CrmSettingsPage = lazyPage(() => import('../modules/crm'), 'CrmSettingsPage');
const InventoryDashboardPage = lazyPage(() => import('../modules/inventory'), 'InventoryDashboard');
const InventoryItemsPage = lazyPage(() => import('../modules/inventory'), 'InventoryItems');
const InventoryItemFormPage = lazyPage(() => import('../modules/inventory'), 'InventoryItemForm');
const InventoryItemDetailPage = lazyPage(() => import('../modules/inventory'), 'InventoryItemDetail');
const InventoryCategoriesPage = lazyPage(() => import('../modules/inventory'), 'InventoryCategories');
const InventorySuppliersPage = lazyPage(() => import('../modules/inventory'), 'InventorySuppliers');
const InventoryMovementsPage = lazyPage(() => import('../modules/inventory'), 'InventoryMovements');
const InventorySettingsPage = lazyPage(() => import('./components/inventory/InventorySupplyChainPages'), 'InventorySettingsPage');
const InventoryTransfersPage = lazyPage(() => import('./components/inventory/InventorySupplyChainPages'), 'InventoryTransfersPage');
const InventoryTransferDetailPage = lazyPage(() => import('./components/inventory/InventorySupplyChainPages'), 'InventoryTransferDetailPage');
const InventoryCountsPage = lazyPage(() => import('./components/inventory/InventorySupplyChainPages'), 'InventoryCountsPage');
const InventoryCountDetailPage = lazyPage(() => import('./components/inventory/InventorySupplyChainPages'), 'InventoryCountDetailPage');
const AnalyticsDashboardPage = lazyPage(() => import('./components/analytics/AnalyticsDashboard'), 'AnalyticsDashboard');
const AnalyticsTemplatesPage = lazyPage(() => import('./components/analytics/AnalyticsTemplates'), 'AnalyticsTemplatesPage');
const AnalyticsTemplateDetailPage = lazyPage(() => import('./components/analytics/AnalyticsTemplates'), 'AnalyticsTemplateDetailPage');
const AnalyticsCatalogPage = lazyPage(() => import('./components/analytics/AnalyticsTemplates'), 'AnalyticsCatalogPage');
const CatalogListPage = lazyPage(() => import('../modules/catalog'), 'CatalogListPage');
const CatalogFormPage = lazyPage(() => import('../modules/catalog'), 'CatalogFormPage');
const CatalogDetailPage = lazyPage(() => import('../modules/catalog'), 'CatalogDetailPage');
const CatalogSettingsPage = lazyPage(() => import('../modules/catalog'), 'CatalogSettingsPage');
const DocumentListPage = lazyPage(() => import('../modules/documents'), 'DocumentListPage');
const DocumentFormPage = lazyPage(() => import('../modules/documents'), 'DocumentFormPage');
const DocumentDetailPage = lazyPage(() => import('../modules/documents'), 'DocumentDetailPage');
const DocumentCategoriesPage = lazyPage(() => import('../modules/documents'), 'DocumentCategoriesPage');
const DocumentSettingsPage = lazyPage(() => import('../modules/documents'), 'DocumentSettingsPage');

const ChecklistsDashboardPage = lazyPage(() => import('../modules/checklists'), 'ChecklistsDashboardPage');
const ChecklistTemplatesPage = lazyPage(() => import('../modules/checklists'), 'ChecklistTemplatesPage');
const ChecklistTemplateFormPage = lazyPage(() => import('../modules/checklists'), 'ChecklistTemplateFormPage');
const ChecklistExecutionsPage = lazyPage(() => import('../modules/checklists'), 'ChecklistExecutionsPage');
const ChecklistExecutionPage = lazyPage(() => import('../modules/checklists'), 'ChecklistExecutionPage');

const CMVDashboardPage = lazyPage(() => import('../modules/cmv'), 'CMVDashboardPage');
const CMVByItemPage = lazyPage(() => import('../modules/cmv'), 'CMVByItemPage');
const CMVByUnitPage = lazyPage(() => import('../modules/cmv'), 'CMVByUnitPage');
const CMVByOriginPage = lazyPage(() => import('../modules/cmv'), 'CMVByOriginPage');

const SalesListPage = lazyPage(() => import('../modules/sales'), 'SalesListPage');
const SalesFormPage = lazyPage(() => import('../modules/sales'), 'SalesFormPage');
const SalesDetailPage = lazyPage(() => import('../modules/sales'), 'SalesDetailPage');
const SalesSettingsPage = lazyPage(() => import('../modules/sales'), 'SalesSettingsPage');
const LoyaltyDashboardPage = lazyPage(() => import('../modules/loyalty'), 'LoyaltyDashboardPage');
const LoyaltyRulesPage = lazyPage(() => import('../modules/loyalty'), 'LoyaltyRulesPage');
const LoyaltyWalletsPage = lazyPage(() => import('../modules/loyalty'), 'LoyaltyWalletsPage');
const LoyaltyWalletDetailPage = lazyPage(() => import('../modules/loyalty'), 'LoyaltyWalletDetailPage');
const LoyaltySettingsPage = lazyPage(() => import('../modules/loyalty'), 'LoyaltySettingsPage');

const FranchisePortalLayout = lazyPage(() => import('../modules/franchise'), 'FranchisePortalLayout');
const FranchisePortalRoutes = lazyPage(() => import('../modules/franchise'), 'FranchisePortalRoutes');
const NocDashboardPage = lazyPage(() => import('../modules/noc'), 'NocDashboardPage');
const NocAlertsPage = lazyPage(() => import('../modules/noc'), 'NocAlertsPage');
const NocUnitsPage = lazyPage(() => import('../modules/noc'), 'NocUnitsPage');
const NocUnitDetailPage = lazyPage(() => import('../modules/noc'), 'NocUnitDetailPage');
const AutomationRulesPage = lazyPage(() => import('../modules/automation'), 'AutomationRulesPage');
const TasksPage = lazyPage(() => import('../modules/automation'), 'TasksPage');
const TaskDetailPage = lazyPage(() => import('../modules/automation'), 'TaskDetailPage');
const CommunicationInboxPage = lazyPage(() => import('../modules/communication-inbox'), 'CommunicationInboxPage');
const CommunicationDashboardPage = lazyPage(() => import('../modules/communication-inbox'), 'CommunicationDashboardPage');
const CommunicationAnalyticsPage = lazyPage(() => import('../modules/communication-inbox'), 'CommunicationAnalyticsPage');
const CommunicationSettingsPage = lazyPage(() => import('../modules/communication-inbox'), 'CommunicationSettingsPage');
const CommunicationSettingsChannelsPage = lazyPage(() => import('../modules/communication-inbox'), 'ChannelsPage');
const CommunicationSettingsDepartmentsPage = lazyPage(() => import('../modules/communication-inbox'), 'DepartmentsPage');
const CommunicationSettingsSchedulesPage = lazyPage(() => import('../modules/communication-inbox'), 'SchedulesPage');
const CommunicationSettingsDistributionPage = lazyPage(() => import('../modules/communication-inbox'), 'DistributionPage');
const CommunicationSettingsSlaPage = lazyPage(() => import('../modules/communication-inbox'), 'SlaPage');
const CommunicationSettingsTagsPage = lazyPage(() => import('../modules/communication-inbox'), 'TagsPage');
const CommunicationSettingsAiPage = lazyPage(() => import('../modules/communication-inbox'), 'AIPage');
const CommunicationSettingsWebhooksPage = lazyPage(() => import('../modules/communication-inbox'), 'WebhooksPage');
const OnboardingProgramBuilderPage = lazyPage(() => import('./components/onboarding/OnboardingProgramBuilder'), 'OnboardingProgramBuilder');
const OnboardingImplementationLifecyclePage = lazyPage(() => import('./components/onboarding/OnboardingImplementationLifecycle'), 'OnboardingImplementationLifecycle');
const ImplementationsDashboardPage = lazyPage(() => import('./components/implementations/ImplementationsDashboard'), 'ImplementationsDashboard');
const ImplementationTemplatesPage = lazyPage(() => import('./components/implementations/ImplementationTemplates'), 'ImplementationTemplates');

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
  'implementations-dashboard': ImplementationsDashboardPage,
  'implementation-templates': ImplementationTemplatesPage,
  customers: CustomersListPage,
  'customer-new': CustomerFormPage,
  'customer-detail': CustomerFormPage,
  'customer-settings': CustomerSettingsPage,
  'financial-overview': FinancialOverviewPage,
  'financial-transactions': FinancialTransactionsPage,
  'financial-accounts': FinancialAccountsPage,
  'sales-list': SalesListPage,
  'sales-form': SalesFormPage,
  'sales-detail': SalesDetailPage,
  'sales-settings': SalesSettingsPage,
  'loyalty-dashboard': LoyaltyDashboardPage,
  'loyalty-rules': LoyaltyRulesPage,
  'loyalty-wallets': LoyaltyWalletsPage,
  'loyalty-wallet-detail': LoyaltyWalletDetailPage,
  'loyalty-settings': LoyaltySettingsPage,
  cashflow: CashFlowPage,
  dre: DREPage,
  cmv: CMVPage,
  royalties: RoyaltiesPage,
  'dre-goals': DreGoalsPage,
  'dre-history': DreHistoryPage,
  'dre-projection': DreProjectionPage,
  'royalty-periods': RoyaltyPeriodsPage,
  'crm-dashboard': CrmDashboardPage,
  'crm-kanban': CrmKanbanPage,
  'crm-leads': CrmLeadsPage,
  'crm-lead-form': CrmLeadFormPage,
  'crm-lead-detail': CrmLeadDetailPage,
  'crm-pipelines': CrmPipelinesPage,
  'crm-settings': CrmSettingsPage,
  'inventory-dashboard': InventoryDashboardPage,
  'inventory-items': InventoryItemsPage,
  'inventory-item-form': InventoryItemFormPage,
  'inventory-item-detail': InventoryItemDetailPage,
  'inventory-categories': InventoryCategoriesPage,
  'inventory-suppliers': InventorySuppliersPage,
  'inventory-movements': InventoryMovementsPage,
  'inventory-settings': InventorySettingsPage,
  'inventory-transfers': InventoryTransfersPage,
  'inventory-transfer-detail': InventoryTransferDetailPage,
  'inventory-counts': InventoryCountsPage,
  'inventory-count-detail': InventoryCountDetailPage,
  'analytics-dashboard': AnalyticsDashboardPage,
  'analytics-templates': AnalyticsTemplatesPage,
  'analytics-template-detail': AnalyticsTemplateDetailPage,
  'analytics-catalog': AnalyticsCatalogPage,
  'catalog-list': CatalogListPage,
  'catalog-form': CatalogFormPage,
  'catalog-detail': CatalogDetailPage,
  'catalog-settings': CatalogSettingsPage,
  'documents-list': DocumentListPage,
  'document-new': DocumentFormPage,
  'document-detail': DocumentDetailPage,
  'document-categories': DocumentCategoriesPage,
  'document-settings': DocumentSettingsPage,
  analytics: AnalyticsDashboardPage,
  operations: () => <PlaceholderPage title="Operacao" description="Checklists, pendencias e diario de bordo para gestao operacional da rede." />,
  checklists: ChecklistsDashboardPage,
  'checklist-templates': ChecklistTemplatesPage,
  'checklist-template-new': ChecklistTemplateFormPage,
  'checklist-template-detail': ChecklistTemplateFormPage,
  'checklist-executions': ChecklistExecutionsPage,
  'checklist-execution-detail': ChecklistExecutionPage,
  'cmv-dashboard': CMVDashboardPage,
  'cmv-by-item': CMVByItemPage,
  'cmv-by-unit': CMVByUnitPage,
  'cmv-by-origin': CMVByOriginPage,
  'noc-dashboard': NocDashboardPage,
  'noc-alerts': NocAlertsPage,
  'noc-units': NocUnitsPage,
  'noc-unit-detail': NocUnitDetailPage,
  'automation-rules': AutomationRulesPage,
  'tasks-list': TasksPage,
  'task-detail': TaskDetailPage,
  'communication-inbox': CommunicationInboxPage,
  'communication-dashboard': CommunicationDashboardPage,
  'communication-analytics': CommunicationAnalyticsPage,
  'communication-settings': CommunicationSettingsPage,
  'communication-settings-channels': CommunicationSettingsChannelsPage,
  'communication-settings-departments': CommunicationSettingsDepartmentsPage,
  'communication-settings-schedules': CommunicationSettingsSchedulesPage,
  'communication-settings-distribution': CommunicationSettingsDistributionPage,
  'communication-settings-sla': CommunicationSettingsSlaPage,
  'communication-settings-tags': CommunicationSettingsTagsPage,
  'communication-settings-ai': CommunicationSettingsAiPage,
  'communication-settings-webhooks': CommunicationSettingsWebhooksPage,
  'onboarding-program-builder': OnboardingProgramBuilderPage,
  'onboarding-implementation-lifecycle': OnboardingImplementationLifecyclePage,
  support: CommunicationInboxPage,
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

