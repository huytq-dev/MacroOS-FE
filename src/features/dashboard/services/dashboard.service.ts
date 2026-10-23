import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  DailyProgress,
  ExpenditureSeries,
  GoalProgress,
  NutrientsResponse,
  PeriodsResponse,
  StepsResponse,
} from '../types/dashboard.types'
import type { EnergyBalanceSeriesResponse } from '../types/energy-balance.types'
import type { MacroGranularity, MacroSeriesResponse } from '../types/macros-series.types'

export interface MacrosSeriesParams {
  readonly from?: string
  readonly to?: string
  readonly all?: boolean
  readonly granularity?: MacroGranularity
}

export const dashboardService = {
  expenditure: (from: string, to: string) =>
    apiCall.get<ExpenditureSeries>(apiRoutes.expenditure.root, { params: { from, to } }),
  dailyProgress: (from: string, to: string) =>
    apiCall.get<DailyProgress[]>(apiRoutes.expenditure.daily, { params: { from, to } }),
  goalProgress: () => apiCall.get<GoalProgress>(apiRoutes.goals.progress),
  /** `GET /energy-balance/series?from&to`: từng ngày + thống kê khoảng (`summary`) do BE tính, dùng cho thẻ Energy Balance của Dashboard. */
  energyBalance: (from: string, to: string) =>
    apiCall.get<EnergyBalanceSeriesResponse>(apiRoutes.energyBalance.series, {
      params: { from, to },
    }),
  steps: (from: string, to: string) =>
    apiCall.get<StepsResponse>(apiRoutes.steps.root, { params: { from, to } }),
  periods: (from: string, to: string) =>
    apiCall.get<PeriodsResponse>(apiRoutes.periods.root, { params: { from, to } }),
  /** `GET /nutrients/macros/series`: kcal / gram / % mỗi ngày + `summary` + `buckets` do BE tính (màn Macros Detail); FE không tự tính lại. */
  macrosSeries: (params: MacrosSeriesParams) =>
    apiCall.get<MacroSeriesResponse>(apiRoutes.nutrients.macrosSeries, { params }),
  nutrients: (date: string) =>
    apiCall.get<NutrientsResponse>(apiRoutes.nutrients.root, { params: { date } }),
}
