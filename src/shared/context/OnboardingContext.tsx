import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { OnboardingState, WizardStepId, WizardStepData } from '../../types/onboarding';
import { INITIAL_ONBOARDING_STATE } from '../../types/onboarding';
import * as svc from '../../services/onboardingService';
import { useAuth } from './AuthContext';

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'HYDRATE'; state: OnboardingState }
  | { type: 'OPEN_WIZARD' }
  | { type: 'CLOSE_WIZARD' }
  | { type: 'SET_WIZARD_STEP'; step: number }
  | { type: 'SAVE_STEP_DATA'; data: Partial<WizardStepData> }
  | { type: 'COMPLETE_WIZARD' }
  | { type: 'START_TOUR' }
  | { type: 'SET_TOUR_STOP'; stop: number }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'COMPLETE_CHECKLIST_ITEM'; itemId: string };

interface LocalState extends OnboardingState {
  wizardOpen: boolean;
}

function reducer(state: LocalState, action: Action): LocalState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        ...action.state,
        // Auto-open wizard for first-time users
        wizardOpen: !action.state.wizardCompleted && !action.state.wizardStarted,
      };
    case 'OPEN_WIZARD':
      return { ...state, wizardOpen: true };
    case 'CLOSE_WIZARD':
      return { ...state, wizardOpen: false };
    case 'SET_WIZARD_STEP':
      return { ...state, currentWizardStep: action.step };
    case 'SAVE_STEP_DATA':
      return { ...state, stepData: { ...state.stepData, ...action.data } };
    case 'COMPLETE_WIZARD':
      return { ...state, wizardCompleted: true, wizardOpen: false, tourActive: true, currentTourStop: 0 };
    case 'START_TOUR':
      return { ...state, tourActive: true, currentTourStop: 0 };
    case 'SET_TOUR_STOP':
      return { ...state, currentTourStop: action.stop };
    case 'COMPLETE_TOUR':
      return { ...state, tourActive: false, tourCompleted: true };
    case 'COMPLETE_CHECKLIST_ITEM':
      return {
        ...state,
        checklist: state.checklist.map(i =>
          i.id === action.itemId ? { ...i, completed: true } : i
        ),
      };
    default:
      return state;
  }
}

const INITIAL_LOCAL: LocalState = { ...INITIAL_ONBOARDING_STATE, wizardOpen: false };

// ─── Context ──────────────────────────────────────────────────────────────────

interface OnboardingContextValue {
  state: LocalState;
  // Wizard
  openWizard: () => void;
  closeWizard: () => void;
  goToStep: (step: number) => void;
  saveStepData: (stepId: WizardStepId, data: Partial<WizardStepData>) => Promise<void>;
  completeWizard: () => Promise<void>;
  // Tour
  startTour: () => void;
  advanceTour: () => void;
  completeTour: () => void;
  // Checklist
  completeChecklistItem: (itemId: string) => Promise<void>;
  // Util
  resetOnboarding: () => void;
  /** Percent of checklist complete (0-100) */
  checklistProgress: number;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(reducer, INITIAL_LOCAL);

  const synchronize = useCallback(() => {
    if (!isAuthenticated) return;
    void svc.getOnboardingStatus().then(s => dispatch({ type: 'HYDRATE', state: s }));
  }, [isAuthenticated]);

  // Hydrate and reconcile persisted UI state with real tenant data.
  useEffect(() => {
    synchronize();
  }, [synchronize]);

  useEffect(() => {
    window.addEventListener(svc.ONBOARDING_REALITY_CHANGED_EVENT, synchronize);
    window.addEventListener('focus', synchronize);

    return () => {
      window.removeEventListener(svc.ONBOARDING_REALITY_CHANGED_EVENT, synchronize);
      window.removeEventListener('focus', synchronize);
    };
  }, [synchronize]);

  const openWizard = useCallback(() => dispatch({ type: 'OPEN_WIZARD' }), []);
  const closeWizard = useCallback(() => dispatch({ type: 'CLOSE_WIZARD' }), []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_WIZARD_STEP', step });
  }, []);

  const saveStepData = useCallback(async (
    stepId: WizardStepId,
    data: Partial<WizardStepData>,
  ) => {
    dispatch({ type: 'SAVE_STEP_DATA', data });
    await svc.updateOnboardingStep(stepId, state.currentWizardStep, data);
  }, [state.currentWizardStep]);

  const completeWizard = useCallback(async () => {
    await svc.completeOnboarding();
    dispatch({ type: 'COMPLETE_WIZARD' });
  }, []);

  const startTour = useCallback(() => {
    dispatch({ type: 'START_TOUR' });
    svc.updateTourProgress(0, false);
  }, []);

  const advanceTour = useCallback(() => {
    const next = state.currentTourStop + 1;
    dispatch({ type: 'SET_TOUR_STOP', stop: next });
    svc.updateTourProgress(next, false);
  }, [state.currentTourStop]);

  const completeTour = useCallback(() => {
    dispatch({ type: 'COMPLETE_TOUR' });
    svc.updateTourProgress(state.currentTourStop, true);
  }, [state.currentTourStop]);

  const completeChecklistItemFn = useCallback(async (itemId: string) => {
    dispatch({ type: 'COMPLETE_CHECKLIST_ITEM', itemId });
    await svc.completeChecklistItem(itemId);
  }, []);

  const resetOnboardingFn = useCallback(() => {
    svc.resetOnboarding();
    window.location.reload();
  }, []);

  const checklistProgress = Math.round(
    (state.checklist.filter(i => i.completed).length / state.checklist.length) * 100
  );

  return (
    <OnboardingContext.Provider value={{
      state,
      openWizard,
      closeWizard,
      goToStep,
      saveStepData,
      completeWizard,
      startTour,
      advanceTour,
      completeTour,
      completeChecklistItem: completeChecklistItemFn,
      resetOnboarding: resetOnboardingFn,
      checklistProgress,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
