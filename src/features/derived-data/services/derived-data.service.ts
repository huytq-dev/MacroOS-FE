import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { DerivedStatus } from '../derived-data.utils'

export const derivedDataService = {
  status: () => apiCall.get<DerivedStatus>(apiRoutes.derivedData.status),
  retry: () => apiCall.post<DerivedStatus>(apiRoutes.derivedData.retry),
}
