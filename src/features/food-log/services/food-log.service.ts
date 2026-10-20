import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { QueryResult } from '@/types/api'
import type { FoodLogSettings } from '../food-log-settings'
import { downscalePhoto } from '../ai-plate.utils'
import type {
  AiAnalyzeResponse,
  AiConfirmRequest,
  ResolveIngredientRequest,
  ResolvedIngredient,
  AddEntryRequest,
  AddNoteRequest,
  BulkCopyRequest,
  BulkMoveRequest,
  CopyRequest,
  CreateAndLogRequest,
  CreateAndLogResponse,
  CreateRecipeRequest,
  RecipeNutrientsRequest,
  RecipeNutrientsResponse,
  DayLog,
  LibraryItem,
  LibraryParams,
  NutritionOverviewResponse,
  PlateNutrientsRequest,
  PlateNutrientsResponse,
  WeekLog,
  QuickAddRequest,
  UpdateEntryRequest,
  UpdateNoteRequest,
} from '../types/food-log.types'

const AI_ANALYZE_TIMEOUT_MS = 60_000

export const foodLogService = {
  getDay: (date: string) => apiCall.get<DayLog>(apiRoutes.foodLogs.root, { params: { date } }),
  nutritionOverview: (range: string, date: string) =>
    apiCall.get<NutritionOverviewResponse>(apiRoutes.nutrition.overview, {
      params: { range, date },
    }),
  getWeek: (date: string) => apiCall.get<WeekLog>(apiRoutes.foodLogs.week, { params: { date } }),
  addEntry: (payload: AddEntryRequest) => apiCall.post<string>(apiRoutes.foodLogs.entries, payload),
  updateEntry: (id: string, payload: UpdateEntryRequest) =>
    apiCall.put(apiRoutes.foodLogs.entry(id), payload),
  deleteEntry: (id: string) => apiCall.delete(apiRoutes.foodLogs.entry(id)),
  quickAdd: (payload: QuickAddRequest) =>
    apiCall.post<string>(apiRoutes.foodLogs.quickAdd, payload),
  copy: (payload: CopyRequest) => apiCall.post<number>(apiRoutes.foodLogs.copy, payload),
  bulkCopy: (payload: BulkCopyRequest) =>
    apiCall.post<number>(apiRoutes.foodLogs.bulkCopy, payload),
  bulkMove: (payload: BulkMoveRequest) =>
    apiCall.post<number>(apiRoutes.foodLogs.bulkMove, payload),
  bulkDelete: (ids: string[]) => apiCall.post<number>(apiRoutes.foodLogs.bulkDelete, { ids }),
  clearDay: (date: string) => apiCall.delete(apiRoutes.foodLogs.byDate(date)),
  addNote: (payload: AddNoteRequest) => apiCall.post<string>(apiRoutes.foodLogs.notes, payload),
  updateNote: (id: string, payload: UpdateNoteRequest) =>
    apiCall.put(apiRoutes.foodLogs.note(id), payload),
  deleteNote: (id: string) => apiCall.delete(apiRoutes.foodLogs.note(id)),
  aiAnalyze: async (photos: File[], description: string) => {
    const form = new FormData()
    // Thu nhỏ trước khi gửi để không vượt giới hạn body của proxy /api và để AI trả nhanh hơn
    const scaled = await Promise.all(photos.map(downscalePhoto))
    scaled.forEach((photo) => form.append('photos', photo))
    form.append('description', description)
    return apiCall.post<AiAnalyzeResponse>(apiRoutes.foodLogs.aiAnalyze, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // BE chờ model tối đa 45 giây.
      timeout: AI_ANALYZE_TIMEOUT_MS,
    })
  },
  aiConfirm: (payload: AiConfirmRequest) =>
    apiCall.post<{ scanId: string; status: string; remembered: number }>(
      apiRoutes.foodLogs.aiConfirm,
      payload
    ),
  plateNutrients: (payload: PlateNutrientsRequest) =>
    apiCall.post<PlateNutrientsResponse>(apiRoutes.foodLogs.plateNutrients, payload),
  resolveIngredient: (payload: ResolveIngredientRequest) =>
    apiCall.post<ResolvedIngredient>(apiRoutes.foodLogs.aiResolveIngredient, payload),
  getLibrary: (params: LibraryParams) =>
    apiCall.get<QueryResult<LibraryItem>>(apiRoutes.library, { params }),
  createRecipe: (payload: CreateRecipeRequest) =>
    apiCall.post<string>(apiRoutes.recipes.root, payload),
  createRecipeAndLog: (payload: CreateAndLogRequest) =>
    apiCall.post<CreateAndLogResponse>(apiRoutes.recipes.createAndLog, payload),
  recipeNutrients: (payload: RecipeNutrientsRequest) =>
    apiCall.post<RecipeNutrientsResponse>(apiRoutes.recipes.nutrients, payload),
  getSettings: () => apiCall.get<FoodLogSettings>(apiRoutes.foodLogs.settings),
  saveSettings: (payload: FoodLogSettings) => apiCall.put(apiRoutes.foodLogs.settings, payload),
}
