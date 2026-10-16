import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { QueryResult } from '@/types/api'
import type {
  CustomFoodRequest,
  FoodDetail,
  FoodSearchParams,
  FoodSummary,
} from '../types/food.types'

export const foodService = {
  search: (params: FoodSearchParams) =>
    apiCall.get<QueryResult<FoodSummary>>(apiRoutes.foods.root, { params }),
  get: (id: string) => apiCall.get<FoodDetail>(apiRoutes.foods.byId(id)),
  create: (payload: CustomFoodRequest) => apiCall.post<string>(apiRoutes.foods.root, payload),
  update: (id: string, payload: CustomFoodRequest) =>
    apiCall.put(apiRoutes.foods.byId(id), payload),
  remove: (id: string) => apiCall.delete(apiRoutes.foods.byId(id)),
}
