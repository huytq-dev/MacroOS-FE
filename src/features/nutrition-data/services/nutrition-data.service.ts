import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  NutritionDay,
  NutritionDaysResponse,
  SaveNutritionDayRequest,
} from '../types/nutrition-data.types'

/** Kích thước trang của danh sách ngày NDM (BE: mặc định 90, tối đa 366). */
export const PAGE_SIZE = 90

/** Mỗi thao tác một phạm vi, một endpoint (xem `nutrition-data.utils.ts`: INTENT_SCOPE). */
export const nutritionDataService = {
  /** Một trang (`limit` mặc định 90 = kích thước trang, KHÔNG phải giới hạn lịch sử): `before` = `nextBefore` của trang trước (loại trừ) để lấy các ngày cũ hơn. */
  list: (before?: string | null) =>
    apiCall.get<NutritionDaysResponse>(apiRoutes.nutritionData.root, {
      params: { limit: PAGE_SIZE, ...(before ? { before } : {}) },
    }),
  /** Lưu số của ngày (cùng cờ). Không bao giờ xoá món; ngày đã có món / nhiều entry → 409 MANUAL_OVERRIDE_UNAVAILABLE. */
  save: (payload: SaveNutritionDayRequest) =>
    apiCall.put<unknown>(apiRoutes.nutritionData.root, payload),
  /** Một ngày cụ thể (cho ngày cũ hơn các trang đã tải): `from` = `to` = `date`. */
  day: (date: string) =>
    apiCall.get<NutritionDaysResponse>(apiRoutes.nutritionData.root, {
      params: { from: date, to: date, limit: 1 },
    }),
  /** Delete Nutrition Data: tổng nhập tay + cờ nhịn ăn của ngày. Giữ món, nước, ghi chú, cờ chưa đủ. */
  remove: (date: string) => apiCall.delete(apiRoutes.nutritionData.root, { params: { date } }),
  /** Remove Manual Override: chỉ tổng nhập tay. Giữ món, nước, ghi chú, cờ nhịn ăn và cờ chưa đủ. */
  removeOverride: (date: string) =>
    apiCall.delete<NutritionDay>(apiRoutes.nutritionData.override(date)),
  /** Chỉ cờ nhịn ăn. Bật trên ngày đã có entry → 409 FASTING_NEEDS_EMPTY_DAY. */
  setFasting: (date: string, isFasting: boolean) =>
    apiCall.put<NutritionDay>(apiRoutes.nutritionData.fasting(date), { isFasting }),
  /** Chỉ cờ chưa đủ, cho ngày đã có dữ liệu. */
  setIncomplete: (date: string, isIncomplete: boolean) =>
    apiCall.put<NutritionDay>(apiRoutes.nutritionData.incomplete(date), { isIncomplete }),
}
