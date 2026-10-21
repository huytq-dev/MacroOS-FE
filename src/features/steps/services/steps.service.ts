import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import { addDaysIso } from '@/lib/date'
import type { StepsHistory, UpsertStepsRequest } from '../types/steps.types'

/** Lịch sử lấy 10 năm tới hôm nay (BE mặc định chỉ 30 ngày); trang lọc kỳ ở FE. */
const HISTORY_DAYS = 3650

export const stepsService = {
  listAll: (to: string) =>
    apiCall.get<StepsHistory>(apiRoutes.steps.root, {
      params: { from: addDaysIso(to, -HISTORY_DAYS), to },
    }),
  upsert: (payload: UpsertStepsRequest) => apiCall.post<string>(apiRoutes.steps.root, payload),
  remove: (logDate: string) => apiCall.delete(apiRoutes.steps.byDate(logDate)),
}
