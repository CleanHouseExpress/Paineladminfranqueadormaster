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
 * Priority: imperative override > tenant blocked > registry status > tenant enabled
 */
export function useModule(moduleId: string) {
  const { getModuleState, setModuleState, resetModuleState } = useModuleContext();
  const { isModuleEnabled, isModuleBlocked } = useTenant();

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
  } else if (!isModuleEnabled(moduleId)) {
    switch (definition.status) {
      case 'available':    effectiveState = 'available';    break;
      case 'review':       effectiveState = 'review';       break;
      case 'development':  effectiveState = 'available';    break;
      case 'blocked':      effectiveState = 'blocked';      break;
      default:             effectiveState = 'available';
    }
  }

  return {
    definition,
    state: effectiveState,
    isActive: effectiveState === 'active',
    setModuleState: (s: ModuleUIState) => setModuleState(moduleId, s),
    reset: () => resetModuleState(moduleId),
  };
}
