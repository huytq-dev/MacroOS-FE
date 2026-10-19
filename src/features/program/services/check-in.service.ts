import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { CheckInSession, SetCheckInModulesRequest } from '../types/check-in.types'

export const checkInService = {
  getSession: () => apiCall.get<CheckInSession>(apiRoutes.checkIns.session),
  setIncompleteDays: (dates: string[]) =>
    apiCall.put<CheckInSession>(apiRoutes.checkIns.incompleteDays, { dates }),
  setModules: (payload: SetCheckInModulesRequest) =>
    apiCall.put(apiRoutes.checkIns.modules, payload),
  accept: () => apiCall.post<string>(apiRoutes.checkIns.accept),
  reject: () => apiCall.post<string>(apiRoutes.checkIns.reject),
}
