import { apiClient } from './apiClient';
import type {
  InventoryOnboardingContext,
  InventoryOnboardingState,
  InventoryOnboardingUpdatePayload,
  InventoryOnboardingStatus,
} from '../types/inventoryOnboarding';

type DataResponse<T> = { data: T };

function statusFor(state: Omit<InventoryOnboardingState, 'status'>): InventoryOnboardingStatus {
  if (state.completed) return 'completed';
  if (state.dismissed) return 'dismissed';
  if (state.steps.length === 0) return 'empty';
  if (!state.started) return 'not_started';
  return 'in_progress';
}

function withStatus(state: Omit<InventoryOnboardingState, 'status'>): InventoryOnboardingState {
  return { ...state, status: statusFor(state) };
}

const endpoint = '/api/company/inventory/onboarding';

export const inventoryOnboardingService = {
  async getProgress(context: InventoryOnboardingContext = 'network') {
    const response = await apiClient.get<DataResponse<Omit<InventoryOnboardingState, 'status'>>>(`${endpoint}?context=${context}`);
    return withStatus(response.data);
  },

  async updateProgress(payload: InventoryOnboardingUpdatePayload) {
    const response = await apiClient.put<DataResponse<Omit<InventoryOnboardingState, 'status'>>>(endpoint, {
      context: 'network',
      ...payload,
    });
    return withStatus(response.data);
  },

  async dismiss(context: InventoryOnboardingContext = 'network') {
    const response = await apiClient.post<DataResponse<Omit<InventoryOnboardingState, 'status'>>>(`${endpoint}/dismiss`, { context });
    return withStatus(response.data);
  },

  async reset(context: InventoryOnboardingContext = 'network') {
    const response = await apiClient.post<DataResponse<Omit<InventoryOnboardingState, 'status'>>>(`${endpoint}/reset`, { context });
    return withStatus(response.data);
  },
};
