import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { ProgramType } from '@/config/enums'
import type {
  CreateProgramRequest,
  GoalHistoryItem,
  Program,
  ProgramPreview,
  ProgramSetup,
  UpdateProgramGoalRequest,
} from '../types/program.types'

export const programService = {
  getCurrent: () => apiCall.get<Program>(apiRoutes.programs.current),
  setup: () => apiCall.get<ProgramSetup>(apiRoutes.programs.setup),
  preview: (payload: CreateProgramRequest) =>
    apiCall.post<ProgramPreview>(apiRoutes.programs.preview, payload),
  create: (payload: CreateProgramRequest) => apiCall.post<string>(apiRoutes.programs.root, payload),
  updateGoal: (payload: UpdateProgramGoalRequest) => apiCall.put(apiRoutes.programs.goal, payload),
  changeStyle: (programType: ProgramType) => apiCall.put(apiRoutes.programs.style, { programType }),
  setManualExpenditure: (tdeeKcal: number) =>
    apiCall.put(apiRoutes.programs.expenditure, { tdeeKcal }),
  end: () => apiCall.delete(apiRoutes.programs.current),
  goalHistory: () => apiCall.get<GoalHistoryItem[]>(apiRoutes.goals.history),
}
