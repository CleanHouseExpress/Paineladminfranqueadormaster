export interface WhiteLabelConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  logoText: string;
  favicon?: string;
  loginBg?: string;
  supportEmail?: string;
  platformName: string;
}

export interface MenuItemConfig {
  moduleId: string;
  visible: boolean;
  order: number;
  isHomepage: boolean;
  isFavorite: boolean;
}

export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  plan: 'starter' | 'professional' | 'enterprise';
  /** Module IDs that are enabled for this tenant */
  enabledModuleIds: string[];
  whiteLabel: WhiteLabelConfig;
  /** Per-tenant menu customization */
  menuConfig: MenuItemConfig[];
  /** Module IDs that have been requested but not yet active */
  pendingModuleIds: string[];
  /** Module IDs that are blocked at the tenant level */
  blockedModuleIds: string[];
}
