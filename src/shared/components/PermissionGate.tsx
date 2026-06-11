import { ModuleStateView } from './ModuleStateView';
import { usePermission } from '../hooks/usePermission';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  permissions = [],
  mode = 'all',
  fallback,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
  const required = permission ? [permission, ...permissions] : permissions;
  const allowed = required.length === 0
    || (mode === 'any' ? hasAnyPermission(required) : hasAllPermissions(required))
    || (permission ? hasPermission(permission) : false);

  if (!allowed) {
    return fallback ?? <ModuleStateView state="no-permission" />;
  }

  return <>{children}</>;
}
