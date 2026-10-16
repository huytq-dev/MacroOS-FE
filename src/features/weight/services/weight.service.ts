import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { UpsertWeightRequest, WeightEntries } from '../types/weight.types'

export const weightService = {
  list: (from: string, to: string) =>
    apiCall.get<WeightEntries>(apiRoutes.weights.root, { params: { from, to } }),
  upsert: (payload: UpsertWeightRequest) => apiCall.post<string>(apiRoutes.weights.root, payload),
  remove: (logDate: string) => apiCall.delete(apiRoutes.weights.byDate(logDate)),
}
