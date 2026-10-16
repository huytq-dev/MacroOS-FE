import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { ProgramType } from '@/config/enums'
import type {
  CreateProgramRequest,
  Program,
  UpdateProgramGoalRequest,
} from '../types/program.types'

export const programService = {
  getCurrent: () => apiCall.get<Program>(apiRoutes.programs.current),
  create: (payload: CreateProgramRequest) => apiCall.post<string>(apiRoutes.programs.root, payload),
  updateGoal: (payload: UpdateProgramGoalRequest) => apiCall.put(apiRoutes.programs.goal, payload),
  changeStyle: (programType: ProgramType) => apiCall.put(apiRoutes.programs.style, { programType }),
  setManualExpenditure: (tdeeKcal: number) =>
    apiCall.put(apiRoutes.programs.expenditure, { tdeeKcal }),
  end: () => apiCall.delete(apiRoutes.programs.current),
}
