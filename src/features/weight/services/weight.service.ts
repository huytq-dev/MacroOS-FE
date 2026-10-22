import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  MeasurementSeries,
  UpsertMeasurementRequest,
  UpsertVisualBodyFatRequest,
  UpsertWeightRequest,
  VisualBodyFatEntries,
  WeighInHabit,
  WeightEntries,
} from '../types/weight.types'

export const weightService = {
  list: (from: string, to: string) =>
    apiCall.get<WeightEntries>(apiRoutes.weights.root, { params: { from, to } }),
  /** Toàn bộ lịch sử tới `to` (BE `all=true`: từ lần cân đầu tiên). */
  listAll: (to: string) =>
    apiCall.get<WeightEntries>(apiRoutes.weights.root, { params: { to, all: true } }),
  /** Trang Habits (Weigh-In): ngày có cân của cả năm + streak toàn thời gian (không giới hạn ở năm đang xem). */
  habit: (year: number) => apiCall.get<WeighInHabit>(apiRoutes.weights.habit, { params: { year } }),
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

  listMeasurement: (key: string, to: string) =>
    apiCall.get<MeasurementSeries>(apiRoutes.bodyMetrics.measurement(key), {
      params: { to, all: true },
    }),
  upsertMeasurement: (key: string, payload: UpsertMeasurementRequest) =>
    apiCall.post(apiRoutes.bodyMetrics.measurement(key), payload),
  removeMeasurement: (key: string, date: string) =>
    apiCall.delete(apiRoutes.bodyMetrics.measurementByDate(key, date)),
}
