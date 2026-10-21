import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import { addDaysIso } from '@/lib/date'
import type { PeriodHistory, PeriodRequest } from '../types/period.types'

/** Lịch sử lấy 10 năm tới hôm nay (BE mặc định chỉ 365 ngày). */
const HISTORY_DAYS = 3650

export const periodService = {
  listAll: (to: string) =>
    apiCall.get<PeriodHistory>(apiRoutes.periods.root, {
      params: { from: addDaysIso(to, -HISTORY_DAYS), to },
    }),
  create: (payload: PeriodRequest) => apiCall.post<string>(apiRoutes.periods.root, payload),
  update: (id: string, payload: PeriodRequest) => apiCall.put(apiRoutes.periods.byId(id), payload),
  remove: (id: string) => apiCall.delete(apiRoutes.periods.byId(id)),
}
