import { useModuleContext } from '../context/ModuleContext';
import { useTenant } from '../context/TenantContext';
import { getModule } from '../../services/moduleRegistry';
import type { ModuleUIState } from '../../types';

/**
 * Resolves the effective UI state for a given module, merging:
 *  1. Tenant-level activation (enabled / blocked)
 *  2. Registry status (development, review, available)
 *  3. Imperative state set via setModuleState()
 *
 * Priority: imperative override > tenant blocked > registry hard block > active by default
 */
export function useModule(moduleId: string) {
  const { getModuleState, setModuleState, resetModuleState } = useModuleContext();
  const { isModuleBlocked } = useTenant();

  const definition = getModule(moduleId);
  const imperativeState = getModuleState(moduleId);

  let effectiveState: ModuleUIState = 'active';

  if (imperativeState !== 'active') {
    // Explicit override wins
    effectiveState = imperativeState;
  } else if (!definition) {
    effectiveState = 'error';
  } else if (isModuleBlocked(moduleId)) {
    effectiveState = 'blocked';
  } else if (definition.status === 'blocked') {
    effectiveState = 'blocked';
  }

  return {
    definition,
    state: effectiveState,
    isActive: effectiveState === 'active',
    setModuleState: (s: ModuleUIState) => setModuleState(moduleId, s),
    reset: () => resetModuleState(moduleId),
  };
}
