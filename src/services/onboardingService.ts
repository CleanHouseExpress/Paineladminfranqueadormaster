/**
 * Mock onboarding service — wraps localStorage with an async interface shaped
 * after the real API so the implementation can be swapped without changing callers.
 *
 * Real API contracts:
 *   GET  /onboarding/status  → OnboardingState
 *   PUT  /onboarding/step    → { step, data } → OnboardingState
 *   POST /onboarding/complete → OnboardingState
 */

import type { OnboardingState, WizardStepId, WizardStepData } from '../types/onboarding';
import { INITIAL_ONBOARDING_STATE } from '../types/onboarding';

const STORAGE_KEY = 'orchestra_onboarding_v1';

const delay = (ms = 80) => new Promise(r => setTimeout(r, ms));

function load(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_ONBOARDING_STATE };
    return { ...INITIAL_ONBOARDING_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...INITIAL_ONBOARDING_STATE };
  }
}

function save(state: OnboardingState): OnboardingState {
  const next = { ...state, lastSynced: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

// ─── Public API (matches real endpoints) ──────────────────────────────────────

/** GET /onboarding/status */
export async function getOnboardingStatus(): Promise<OnboardingState> {
  await delay();
  return load();
}

/** PUT /onboarding/step */
export async function updateOnboardingStep(
  stepId: WizardStepId,
  stepIndex: number,
  data: Partial<WizardStepData>,
): Promise<OnboardingState> {
  await delay();
  const current = load();
  const next = save({
    ...current,
    wizardStarted: true,
    currentWizardStep: Math.max(current.currentWizardStep, stepIndex),
    stepData: { ...current.stepData, ...data },
  });
  void stepId; // used by real API for validation
  return next;
}

/** POST /onboarding/complete */
export async function completeOnboarding(): Promise<OnboardingState> {
  await delay();
  const current = load();
  return save({
    ...current,
    wizardCompleted: true,
    currentWizardStep: 8,
    checklist: current.checklist.map(item =>
      ['network', 'whitelabel', 'modules'].includes(item.id)
        ? { ...item, completed: true }
        : item
    ),
  });
}

/** Persist tour progress */
export async function updateTourProgress(
  stop: number,
  completed: boolean,
): Promise<OnboardingState> {
  await delay(30);
  const current = load();
  return save({
    ...current,
    currentTourStop: stop,
    tourCompleted: completed,
    tourActive: !completed,
    checklist: completed
      ? current.checklist.map(i => i.id === 'tour' ? { ...i, completed: true } : i)
      : current.checklist,
  });
}

/** Mark a checklist item as complete */
export async function completeChecklistItem(itemId: string): Promise<OnboardingState> {
  await delay(30);
  const current = load();
  return save({
    ...current,
    checklist: current.checklist.map(i =>
      i.id === itemId ? { ...i, completed: true } : i
    ),
  });
}

/** Reset (for dev/testing) */
export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}
