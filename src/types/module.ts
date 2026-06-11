export type ModuleStatus =
  | 'active'       // activated for this tenant, user has permission
  | 'available'    // exists in registry but not yet activated
  | 'blocked'      // locked by plan or admin policy
  | 'review'       // pending approval after request
  | 'development'; // not yet released

/** The 9 possible global UI states for any module or page */
export type ModuleUIState =
  | 'active'
  | 'available'
  | 'blocked'
  | 'review'
  | 'loading'
  | 'error'
  | 'empty'
  | 'no-permission'
  | 'no-config';

export interface NavChild {
  label: string;
  path: string;
  badge?: number;
}

export interface NavConfig {
  /** Whether this module appears in the sidebar */
  show: boolean;
  /** Sort order within its group */
  order: number;
  /** Sidebar section */
  group: 'main' | 'system';
  /** Optional label override (falls back to module name) */
  label?: string;
  /** Sub-items that expand below this nav entry */
  children?: NavChild[];
}

export interface RouteConfig {
  /** Full URL path */
  path: string;
  /** Key into COMPONENT_MAP in App.tsx */
  componentId: string;
  /** Owning module id, filled by the registry helpers */
  moduleId?: string;
  /** Optional route-level permissions */
  requiredPermissions?: string[];
}

export interface MarketplaceConfig {
  show: boolean;
  category: string;
  price: string;
}

/** Single source of truth for every module in the platform */
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  /** Lucide icon name (resolved dynamically in Layout/UI) */
  icon: string;
  status: ModuleStatus;

  nav?: NavConfig;
  routes?: RouteConfig[];
  marketplace?: MarketplaceConfig;

  requiredPermissions?: string[];
  requiresConfig?: boolean;
  plan?: 'starter' | 'professional' | 'enterprise';
  price?: string;
}
