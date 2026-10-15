import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { Profile, UpdateProfileRequest } from '../types/user.types'

export const userService = {
  getProfile: () => apiCall.get<Profile>(apiRoutes.users.me),
  updateProfile: (payload: UpdateProfileRequest) => apiCall.put(apiRoutes.users.me, payload),
}
