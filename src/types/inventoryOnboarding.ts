export type InventoryOnboardingContext = 'network' | 'unit';

export type InventoryOnboardingStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'dismissed'
  | 'empty'
  | 'unavailable';

export interface InventoryOnboardingStep {
  id: string;
  title: string;
  path: string;
  permission: string;
  optional: boolean;
  weight: number;
  completed: boolean;
  skipped: boolean;
  auto_completed: boolean;
}

export interface InventoryOnboardingProgress {
  percent: number;
  completed_steps: string[];
  skipped_steps: string[];
  pending_steps: string[];
  auto_completed_steps: string[];
}

export interface InventoryOnboardingState {
  version: number;
  context: InventoryOnboardingContext;
  started: boolean;
  completed: boolean;
  dismissed: boolean;
  current_step: string | null;
  progress: InventoryOnboardingProgress;
  steps: InventoryOnboardingStep[];
  completed_at: string | null;
  status: InventoryOnboardingStatus;
}

export interface InventoryOnboardingUpdatePayload {
  context?: InventoryOnboardingContext;
  current_step?: string | null;
  completed_step?: string;
  skipped_step?: string;
  completed_steps?: string[];
  skipped_steps?: string[];
  completed?: boolean;
}
