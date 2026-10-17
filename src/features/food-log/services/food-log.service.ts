import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { FoodLogSettings } from '../food-log-settings'
import type {
  AddEntryRequest,
  AddNoteRequest,
  CopyRequest,
  DayLog,
  DayStatus,
  WeekLog,
  QuickAddRequest,
  UpdateEntryRequest,
  UpdateNoteRequest,
} from '../types/food-log.types'

export const foodLogService = {
  getDay: (date: string) => apiCall.get<DayLog>(apiRoutes.foodLogs.root, { params: { date } }),
  getWeek: (date: string) => apiCall.get<WeekLog>(apiRoutes.foodLogs.week, { params: { date } }),
  addEntry: (payload: AddEntryRequest) => apiCall.post<string>(apiRoutes.foodLogs.entries, payload),
  updateEntry: (id: string, payload: UpdateEntryRequest) =>
    apiCall.put(apiRoutes.foodLogs.entry(id), payload),
  deleteEntry: (id: string) => apiCall.delete(apiRoutes.foodLogs.entry(id)),
  quickAdd: (payload: QuickAddRequest) =>
    apiCall.post<string>(apiRoutes.foodLogs.quickAdd, payload),
  copy: (payload: CopyRequest) => apiCall.post<number>(apiRoutes.foodLogs.copy, payload),
  clearDay: (date: string) => apiCall.delete(apiRoutes.foodLogs.byDate(date)),
  addNote: (payload: AddNoteRequest) => apiCall.post<string>(apiRoutes.foodLogs.notes, payload),
  updateNote: (id: string, payload: UpdateNoteRequest) =>
    apiCall.put(apiRoutes.foodLogs.note(id), payload),
  deleteNote: (id: string) => apiCall.delete(apiRoutes.foodLogs.note(id)),
  getSettings: () => apiCall.get<FoodLogSettings>(apiRoutes.foodLogs.settings),
  saveSettings: (payload: FoodLogSettings) => apiCall.put(apiRoutes.foodLogs.settings, payload),
  setStatus: (date: string, status: DayStatus) =>
    apiCall.put(apiRoutes.foodLogs.status(date), { status }),
}
