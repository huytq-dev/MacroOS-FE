import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { AddFavoriteRequest, FavoriteFood } from '../types/favorite.types'

export const favoriteService = {
  list: () => apiCall.get<FavoriteFood[]>(apiRoutes.foodFavorites.root),
  add: (payload: AddFavoriteRequest) => apiCall.post<string>(apiRoutes.foodFavorites.root, payload),
  remove: (id: string) => apiCall.delete(apiRoutes.foodFavorites.byId(id)),
  reorder: (ids: string[]) => apiCall.put(apiRoutes.foodFavorites.order, { ids }),
}
