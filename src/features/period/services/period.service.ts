import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import { addDaysIso } from '@/lib/date'
import type { PeriodHistory, SetPeriodDayRequest } from '../types/period.types'

/** Lịch sử lấy 10 năm tới hôm nay (BE mặc định chỉ 365 ngày). */
const HISTORY_DAYS = 3650

export const periodService = {
  listAll: (to: string) =>
    apiCall.get<PeriodHistory>(apiRoutes.periods.root, {
      params: { from: addDaysIso(to, -HISTORY_DAYS), to },
    }),
  /** Đánh dấu / bỏ đánh dấu một ngày; BE gộp hoặc tách khoảng và tính lại độ dài chu kỳ. */
  setDay: (date: string, payload: SetPeriodDayRequest) =>
    apiCall.put(apiRoutes.periods.byDay(date), payload),
  /** Bỏ đánh dấu một ngày (thùng rác); BE tách khoảng nếu cần. */
  deleteDay: (date: string) => apiCall.delete(apiRoutes.periods.byDay(date)),
}
