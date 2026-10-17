import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { DailyProgress, ExpenditureSeries } from '../types/dashboard.types'

export const dashboardService = {
  expenditure: (from: string, to: string) =>
    apiCall.get<ExpenditureSeries>(apiRoutes.expenditure.root, { params: { from, to } }),
  dailyProgress: (from: string, to: string) =>
    apiCall.get<DailyProgress[]>(apiRoutes.expenditure.daily, { params: { from, to } }),
}
