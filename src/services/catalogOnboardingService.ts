import { apiClient } from './apiClient';
import type {
  CatalogOnboardingContext,
  CatalogOnboardingState,
  CatalogOnboardingStatus,
  CatalogOnboardingUpdatePayload,
} from '../types/catalogOnboarding';

type DataResponse<T> = { data: T };

function statusFor(state: Omit<CatalogOnboardingState, 'status'>): CatalogOnboardingStatus {
  if (state.completed) return 'completed';
  if (state.dismissed) return 'dismissed';
  if (state.steps.length === 0) return 'empty';
  if (!state.started) return 'not_started';
  return 'in_progress';
}

function withStatus(state: Omit<CatalogOnboardingState, 'status'>): CatalogOnboardingState {
  return { ...state, status: statusFor(state) };
}

const endpoint = '/api/company/catalog/onboarding';

export const catalogOnboardingService = {
  async getProgress(context: CatalogOnboardingContext = 'network') {
    const response = await apiClient.get<DataResponse<Omit<CatalogOnboardingState, 'status'>>>(`${endpoint}?context=${context}`);
    return withStatus(response.data);
  },

  async updateProgress(payload: CatalogOnboardingUpdatePayload) {
    const response = await apiClient.put<DataResponse<Omit<CatalogOnboardingState, 'status'>>>(endpoint, {
      context: 'network',
      ...payload,
    });
    return withStatus(response.data);
  },

  async dismiss(context: CatalogOnboardingContext = 'network') {
    const response = await apiClient.post<DataResponse<Omit<CatalogOnboardingState, 'status'>>>(`${endpoint}/dismiss`, { context });
    return withStatus(response.data);
  },

  async reset(context: CatalogOnboardingContext = 'network') {
    const response = await apiClient.post<DataResponse<Omit<CatalogOnboardingState, 'status'>>>(`${endpoint}/reset`, { context });
    return withStatus(response.data);
  },
};
