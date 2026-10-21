import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  DailyProgress,
  ExpenditureChange,
  ExpenditureSeries,
  GoalProgress,
  NutrientsResponse,
  PeriodsResponse,
  StepsResponse,
} from '../types/dashboard.types'

export const dashboardService = {
  expenditure: (from: string, to: string) =>
    apiCall.get<ExpenditureSeries>(apiRoutes.expenditure.root, { params: { from, to } }),
  expenditureChanges: () => apiCall.get<ExpenditureChange[]>(apiRoutes.expenditure.changes),
  dailyProgress: (from: string, to: string) =>
    apiCall.get<DailyProgress[]>(apiRoutes.expenditure.daily, { params: { from, to } }),
  goalProgress: () => apiCall.get<GoalProgress>(apiRoutes.goals.progress),
  steps: (from: string, to: string) =>
    apiCall.get<StepsResponse>(apiRoutes.steps.root, { params: { from, to } }),
  periods: (from: string, to: string) =>
    apiCall.get<PeriodsResponse>(apiRoutes.periods.root, { params: { from, to } }),
  nutrients: (date: string) =>
    apiCall.get<NutrientsResponse>(apiRoutes.nutrients.root, { params: { date } }),
}
