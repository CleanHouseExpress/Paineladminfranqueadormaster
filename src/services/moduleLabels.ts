import type { AuthModule } from './authService';

const MODULE_ID_ALIASES: Record<string, string> = {
  communication: 'communication-inbox',
  support: 'communication-inbox',
};

export function moduleIdentity(module: Pick<AuthModule, 'id' | 'moduleId' | 'module_id' | 'slug'> | Partial<AuthModule>) {
  const rawId = String(module.moduleId ?? module.module_id ?? module.slug ?? module.id ?? '');

  return MODULE_ID_ALIASES[rawId] ?? rawId;
}

export function moduleDisplayName(module: Partial<AuthModule> | null | undefined) {
  if (typeof module?.name !== 'string' || !module.name.trim()) return null;

  const name = module.name.trim();
  const normalized = name.toLowerCase();

  if (
    moduleIdentity(module) === 'communication-inbox'
    && ['communication inbox', 'comunication imbox', 'atendimento'].includes(normalized)
  ) {
    return 'Central de Conversas';
  }

  return name;
}

export function configuredModuleLabel(modules: AuthModule[], moduleId: string) {
  return moduleDisplayName(modules.find(module => moduleIdentity(module) === moduleId));
}
