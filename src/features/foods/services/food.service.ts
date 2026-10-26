import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { QueryResult } from '@/types/api'
import { collectFoodPages } from '../food-search.utils'
import type {
  CustomFoodRequest,
  FoodDetail,
  FoodNutrientsResponse,
  FoodSearchParams,
  FoodSummary,
} from '../types/food.types'

export const foodService = {
  // `signal` của TanStack Query: gõ tiếp thì request của từ khoá cũ bị huỷ (không tải và không ghi đè kết quả mới bằng kết quả cũ về muộn)
  search: (params: FoodSearchParams, signal?: AbortSignal) =>
    apiCall.get<QueryResult<FoodSummary>>(apiRoutes.foods.root, { params, signal }),
  /** `params.top` = số dòng muốn có (có thể > 100): đọc nhiều trang `skip` / `top ≤ 100` rồi gộp lại (BE kẹp `top` vào 100). */
  searchUpTo: (params: FoodSearchParams, signal?: AbortSignal) =>
    collectFoodPages(
      async ({ top, skip }) => {
        const page = await foodService.search({ ...params, top, skip }, signal)
        return page && { items: page.items, totalCount: page.totalCount ?? page.items.length }
      },
      params.top ?? 10,
      params.skip ?? 0
    ),
  get: (id: string) => apiCall.get<FoodDetail>(apiRoutes.foods.byId(id)),
  nutrients: (id: string, date: string) =>
    apiCall.get<FoodNutrientsResponse>(apiRoutes.foods.nutrients(id), { params: { date } }),
  byBarcode: (code: string) => apiCall.get<FoodDetail>(apiRoutes.foods.barcode(code)),
  create: (payload: CustomFoodRequest) => apiCall.post<string>(apiRoutes.foods.root, payload),
  update: (id: string, payload: CustomFoodRequest) =>
    apiCall.put(apiRoutes.foods.byId(id), payload),
  remove: (id: string) => apiCall.delete(apiRoutes.foods.byId(id)),
}
