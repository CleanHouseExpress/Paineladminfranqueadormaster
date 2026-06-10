import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ModuleUIState } from '../../types';

// ─── State shape ──────────────────────────────────────────────────────────────

interface ModuleState {
  /** Per-module UI state keyed by moduleId */
  states: Record<string, ModuleUIState>;
  /** Global loading flag (e.g. bootstrapping the app) */
  globalLoading: boolean;
  /** Global error message */
  globalError: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_MODULE_STATE'; moduleId: string; state: ModuleUIState }
  | { type: 'SET_GLOBAL_LOADING'; loading: boolean }
  | { type: 'SET_GLOBAL_ERROR'; error: string | null }
  | { type: 'RESET_MODULE'; moduleId: string };

function reducer(state: ModuleState, action: Action): ModuleState {
  switch (action.type) {
    case 'SET_MODULE_STATE':
      return { ...state, states: { ...state.states, [action.moduleId]: action.state } };
    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.loading };
    case 'SET_GLOBAL_ERROR':
      return { ...state, globalError: action.error };
    case 'RESET_MODULE': {
      const { [action.moduleId]: _, ...rest } = state.states;
      return { ...state, states: rest };
    }
    default:
      return state;
  }
}

const INITIAL: ModuleState = {
  states: {},
  globalLoading: false,
  globalError: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface ModuleContextValue {
  /** Get the current UI state for a module (defaults to 'active') */
  getModuleState: (moduleId: string) => ModuleUIState;
  /** Imperatively set a module's UI state */
  setModuleState: (moduleId: string, state: ModuleUIState) => void;
  /** Reset a module back to 'active' */
  resetModuleState: (moduleId: string) => void;
  /** Global app loading flag */
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  /** Global error string */
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const getModuleState = useCallback(
    (moduleId: string): ModuleUIState => state.states[moduleId] ?? 'active',
    [state.states]
  );

  const setModuleState = useCallback(
    (moduleId: string, uiState: ModuleUIState) =>
      dispatch({ type: 'SET_MODULE_STATE', moduleId, state: uiState }),
    []
  );

  const resetModuleState = useCallback(
    (moduleId: string) => dispatch({ type: 'RESET_MODULE', moduleId }),
    []
  );

  const setGlobalLoading = useCallback(
    (loading: boolean) => dispatch({ type: 'SET_GLOBAL_LOADING', loading }),
    []
  );

  const setGlobalError = useCallback(
    (error: string | null) => dispatch({ type: 'SET_GLOBAL_ERROR', error }),
    []
  );

  return (
    <ModuleContext.Provider value={{
      getModuleState,
      setModuleState,
      resetModuleState,
      globalLoading: state.globalLoading,
      setGlobalLoading,
      globalError: state.globalError,
      setGlobalError,
    }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModuleContext(): ModuleContextValue {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error('useModuleContext must be used inside <ModuleProvider>');
  return ctx;
}
