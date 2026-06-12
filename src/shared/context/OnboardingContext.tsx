import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { NetworkStepData, OnboardingState, TenantSettingsStepData, WhiteLabelStepData, WizardStepId, WizardStepData } from '../../types/onboarding';
import { INITIAL_ONBOARDING_STATE } from '../../types/onboarding';
import * as svc from '../../services/onboardingService';

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
        wizardOpen: !action.state.wizardCompleted,
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
      return { ...state, wizardCompleted: true, wizardOpen: false, tourActive: false, tourCompleted: true };
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
  syncNetworkStep: (data: Partial<NetworkStepData>) => Promise<void>;
  syncBrandingStep: (data: Partial<WhiteLabelStepData>) => Promise<void>;
  syncSettingsStep: (data: Partial<TenantSettingsStepData>) => Promise<void>;
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
  const [state, dispatch] = useReducer(reducer, INITIAL_LOCAL);

  // Hydrate from service on mount
  useEffect(() => {
    svc.getOnboardingStatus().then(s => dispatch({ type: 'HYDRATE', state: s }));
  }, []);

  const openWizard = useCallback(() => dispatch({ type: 'OPEN_WIZARD' }), []);
  const closeWizard = useCallback(() => dispatch({ type: 'CLOSE_WIZARD' }), []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_WIZARD_STEP', step });
  }, []);

  const saveStepData = useCallback(async (
    stepId: WizardStepId,
    data: Partial<WizardStepData>,
  ) => {
    void stepId;
    dispatch({ type: 'SAVE_STEP_DATA', data });
    await svc.saveLocalStepData(state.currentWizardStep, data);
  }, [state.currentWizardStep]);

  const syncNetworkStep = useCallback(async (data: Partial<NetworkStepData>) => {
    dispatch({ type: 'SAVE_STEP_DATA', data: { network: { ...state.stepData.network, ...data } } });
    const next = await svc.syncNetworkStep(state.currentWizardStep, { ...state.stepData.network, ...data });
    dispatch({ type: 'HYDRATE', state: next });
  }, [state.currentWizardStep, state.stepData.network]);

  const syncBrandingStep = useCallback(async (data: Partial<WhiteLabelStepData>) => {
    dispatch({ type: 'SAVE_STEP_DATA', data: { whitelabel: { ...state.stepData.whitelabel, ...data } } });
    const next = await svc.syncBrandingStep(state.currentWizardStep, { ...state.stepData.whitelabel, ...data });
    dispatch({ type: 'HYDRATE', state: next });
  }, [state.currentWizardStep, state.stepData.whitelabel]);

  const syncSettingsStep = useCallback(async (data: Partial<TenantSettingsStepData>) => {
    dispatch({ type: 'SAVE_STEP_DATA', data: { settings: { ...state.stepData.settings, ...data } } });
    const next = await svc.syncSettingsStep(state.currentWizardStep, { ...state.stepData.settings, ...data });
    dispatch({ type: 'HYDRATE', state: next });
  }, [state.currentWizardStep, state.stepData.settings]);

  const completeWizard = useCallback(async () => {
    const next = await svc.completeOnboarding();
    dispatch({ type: 'HYDRATE', state: next });
    dispatch({ type: 'CLOSE_WIZARD' });
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
      syncNetworkStep,
      syncBrandingStep,
      syncSettingsStep,
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
