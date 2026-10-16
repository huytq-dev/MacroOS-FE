import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { ExpenditureSeries } from '../types/dashboard.types'

export const dashboardService = {
  expenditure: (from: string, to: string) =>
    apiCall.get<ExpenditureSeries>(apiRoutes.expenditure.root, { params: { from, to } }),
}
