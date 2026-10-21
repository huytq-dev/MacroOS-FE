import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { NutritionDaysResponse, SaveNutritionDayRequest } from '../types/nutrition-data.types'

export const nutritionDataService = {
  /** Không có `from` / `to` = mọi ngày. */
  list: () => apiCall.get<NutritionDaysResponse>(apiRoutes.nutritionData.root),
  save: (payload: SaveNutritionDayRequest) =>
    apiCall.put<unknown>(apiRoutes.nutritionData.root, payload),
  remove: (date: string) => apiCall.delete(apiRoutes.nutritionData.root, { params: { date } }),
}
