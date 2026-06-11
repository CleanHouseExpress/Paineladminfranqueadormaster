import { useModule } from '../hooks/useModule';
import { ModuleStateView } from './ModuleStateView';
import type { ModuleUIState } from '../../types';

interface ModuleGateProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Override state for dev/testing purposes */
  forceState?: ModuleUIState;
}

/**
 * Wraps a page/section in a permission and state check.
 * If the module is not active for the current tenant/user, renders
 * the appropriate ModuleStateView instead of the children.
 */
export function ModuleGate({ moduleId, children, fallback, forceState }: ModuleGateProps) {
  const { definition, state } = useModule(moduleId);

  const effectiveState = forceState ?? state;

  if (effectiveState !== 'active') {
    return fallback ?? (
      <ModuleStateView
        state={effectiveState}
        moduleName={definition?.name}
      />
    );
  }

  return <>{children}</>;
}
