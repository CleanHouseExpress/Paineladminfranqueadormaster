import type { AuthModule } from './authService';

export function moduleIdentity(module: Pick<AuthModule, 'id' | 'moduleId' | 'module_id' | 'slug'>) {
  return String(module.moduleId ?? module.module_id ?? module.slug ?? module.id ?? '');
}

export function moduleDisplayName(module: Pick<AuthModule, 'name'> | null | undefined) {
  return typeof module?.name === 'string' && module.name.trim() ? module.name.trim() : null;
}

export function configuredModuleLabel(modules: AuthModule[], moduleId: string) {
  return moduleDisplayName(modules.find(module => moduleIdentity(module) === moduleId));
}
