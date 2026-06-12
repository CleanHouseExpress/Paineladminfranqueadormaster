import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModuleContext } from '../context/ModuleContext';
import type { AuthPermission } from '../../services/authService';

function normalizePermission(permission: AuthPermission): string {
  if (typeof permission === 'string') return permission;
  return String(permission.name ?? permission.key ?? permission.slug ?? permission.id ?? '');
}

export function usePermission() {
  const { permissions } = useAuth();
  const { unlockAllModules } = useModuleContext();

  const permissionSet = useMemo(
    () => new Set(permissions.map(normalizePermission).filter(Boolean)),
    [permissions],
  );

  const hasPermission = (permission: string) => unlockAllModules || permissionSet.has(permission);
  const hasAnyPermission = (items: string[]) => items.length === 0 || items.some(hasPermission);
  const hasAllPermissions = (items: string[]) => items.every(hasPermission);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: permissionSet,
  };
}
