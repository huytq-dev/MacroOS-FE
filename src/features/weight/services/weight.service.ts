import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  UpsertVisualBodyFatRequest,
  UpsertWeightRequest,
  VisualBodyFatEntries,
  WeightEntries,
} from '../types/weight.types'

export const weightService = {
  list: (from: string, to: string) =>
    apiCall.get<WeightEntries>(apiRoutes.weights.root, { params: { from, to } }),
  /** Toàn bộ lịch sử tới `to` (BE `all=true`: từ lần cân đầu tiên). */
  listAll: (to: string) =>
    apiCall.get<WeightEntries>(apiRoutes.weights.root, { params: { to, all: true } }),
  upsert: (payload: UpsertWeightRequest) => apiCall.post<string>(apiRoutes.weights.root, payload),
  remove: (logDate: string) => apiCall.delete(apiRoutes.weights.byDate(logDate)),

  listVisualBodyFat: (to: string) =>
    apiCall.get<VisualBodyFatEntries>(apiRoutes.bodyMetrics.visualBodyFat, {
      params: { to, all: true },
    }),
  upsertVisualBodyFat: (payload: UpsertVisualBodyFatRequest) =>
    apiCall.post<string>(apiRoutes.bodyMetrics.visualBodyFat, payload),
  removeVisualBodyFat: (date: string) =>
    apiCall.delete(apiRoutes.bodyMetrics.visualBodyFatByDate(date)),
}
