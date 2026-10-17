import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  DailyProgress,
  ExpenditureChange,
  ExpenditureSeries,
  GoalProgress,
} from '../types/dashboard.types'

export const dashboardService = {
  expenditure: (from: string, to: string) =>
    apiCall.get<ExpenditureSeries>(apiRoutes.expenditure.root, { params: { from, to } }),
  expenditureChanges: () => apiCall.get<ExpenditureChange[]>(apiRoutes.expenditure.changes),
  dailyProgress: (from: string, to: string) =>
    apiCall.get<DailyProgress[]>(apiRoutes.expenditure.daily, { params: { from, to } }),
  goalProgress: () => apiCall.get<GoalProgress>(apiRoutes.goals.progress),
}
