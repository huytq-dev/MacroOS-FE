import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  CompleteRequest,
  OnboardingState,
  PreviewRequest,
  PriorWeightQuestion,
  ProgramPreview,
  SaveBasicsRequest,
  TdeeEstimate,
} from '../types/onboarding.types'

export const onboardingService = {
  getState: () => apiCall.get<OnboardingState>(apiRoutes.onboarding.root),
  saveBasics: (payload: SaveBasicsRequest) => apiCall.put(apiRoutes.onboarding.basics, payload),
  estimate: () => apiCall.get<TdeeEstimate>(apiRoutes.onboarding.estimate),
  priorWeightQuestion: (params: { weightKg?: number; unit: 'kg' | 'lb' }) =>
    apiCall.get<PriorWeightQuestion>(apiRoutes.onboarding.priorWeightQuestion, { params }),
  preview: (payload: PreviewRequest) =>
    apiCall.post<ProgramPreview>(apiRoutes.onboarding.preview, payload),
  complete: (payload: CompleteRequest) => apiCall.post(apiRoutes.onboarding.complete, payload),
}
