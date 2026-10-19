import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  GoalEditPreview,
  GoalEditPreviewRequest,
  GoalEditRequest,
  GoalEditResult,
} from '../types/goal-edit.types'

export const goalEditService = {
  preview: (payload: GoalEditPreviewRequest) =>
    apiCall.post<GoalEditPreview>(apiRoutes.goals.editPreview, payload),
  save: (payload: GoalEditRequest) => apiCall.put<GoalEditResult>(apiRoutes.goals.edit, payload),
}
