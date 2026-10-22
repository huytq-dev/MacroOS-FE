import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  ExpenditureSettings,
  SaveExpenditureSettingsRequest,
  SetCalculationModeRequest,
} from '../types/expenditure-settings.types'

const required = (settings: ExpenditureSettings | null | undefined) => {
  if (!settings) throw new Error('Empty expenditure settings response')
  return settings
}

export const expenditureSettingsService = {
  get: async () => required(await apiCall.get<ExpenditureSettings>(apiRoutes.expenditure.settings)),
  save: async (payload: SaveExpenditureSettingsRequest) =>
    required(await apiCall.put<ExpenditureSettings>(apiRoutes.expenditure.settings, payload)),
  setMode: async (payload: SetCalculationModeRequest) =>
    required(await apiCall.post<ExpenditureSettings>(apiRoutes.expenditure.mode, payload)),
}
