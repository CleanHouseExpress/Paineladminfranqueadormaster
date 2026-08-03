export type CatalogOnboardingContext = 'network' | 'unit';
export type CatalogOnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'dismissed' | 'empty';

export interface CatalogOnboardingStep {
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

export interface CatalogOnboardingState {
  version: number;
  context: CatalogOnboardingContext;
  started: boolean;
  completed: boolean;
  dismissed: boolean;
  current_step: string;
  suggested_next_module?: {
    id: string;
    label: string;
    path: string;
  } | null;
  progress: {
    percent: number;
    completed_steps: string[];
    skipped_steps: string[];
    pending_steps: string[];
    auto_completed_steps: string[];
  };
  steps: CatalogOnboardingStep[];
  completed_at: string | null;
  status: CatalogOnboardingStatus;
}

export interface CatalogOnboardingUpdatePayload {
  context?: CatalogOnboardingContext;
  current_step?: string | null;
  completed_step?: string;
  skipped_step?: string;
  completed_steps?: string[];
  skipped_steps?: string[];
  completed?: boolean;
}
