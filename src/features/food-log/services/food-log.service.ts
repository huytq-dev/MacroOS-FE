import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  AddEntryRequest,
  CopyRequest,
  DayLog,
  QuickAddRequest,
  UpdateEntryRequest,
} from '../types/food-log.types'

export const foodLogService = {
  getDay: (date: string) => apiCall.get<DayLog>(apiRoutes.foodLogs.root, { params: { date } }),
  addEntry: (payload: AddEntryRequest) => apiCall.post<string>(apiRoutes.foodLogs.entries, payload),
  updateEntry: (id: string, payload: UpdateEntryRequest) =>
    apiCall.put(apiRoutes.foodLogs.entry(id), payload),
  deleteEntry: (id: string) => apiCall.delete(apiRoutes.foodLogs.entry(id)),
  quickAdd: (payload: QuickAddRequest) =>
    apiCall.post<string>(apiRoutes.foodLogs.quickAdd, payload),
  copy: (payload: CopyRequest) => apiCall.post<number>(apiRoutes.foodLogs.copy, payload),
  clearDay: (date: string) => apiCall.delete(apiRoutes.foodLogs.byDate(date)),
}
