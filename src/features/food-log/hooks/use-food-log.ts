'use client'

import { useRef, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { EMPTY_AI_EDITS, type AiPlateEdits, type IngredientEdit } from '../ai-plate.utils'
import { foodLogService } from '../services/food-log.service'
import type {
  AddEntryRequest,
  AddNoteRequest,
  BulkCopyRequest,
  BulkMoveRequest,
  AiConfirmIngredient,
  AiDish,
  AiIngredient,
  CopyRequest,
  CreateAndLogRequest,
  CreateRecipeRequest,
  RecipeNutrientsRequest,
  DayLog,
  IngredientState,
  LibraryParams,
  PlateNutrientsRequest,
  QuickAddRequest,
  ResolvedIngredient,
  UpdateEntryRequest,
  UpdateNoteRequest,
  WeekDay,
  WeekLog,
} from '../types/food-log.types'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { refreshDerivedStatus } from '@/features/derived-data/derived-data.utils'
import { ndmErrorMessage, ndmReasonOf } from '@/features/nutrition-data/nutrition-data.utils'
import { reportMutationError } from '@/lib/mutation-feedback'
import { logger } from '@/lib/api'
import { weekBlocksOf, weekDates } from '@/lib/week'

export const foodLogKeys = {
  all: ['food-log'] as const,
  day: (date: string) => ['food-log', 'day', date] as const,
  week: (date: string) => ['food-log', 'week', date] as const,
  library: ['food-log', 'library'] as const,
}

/**
 * Dữ liệu BE tính từ log ăn uống phải làm mới cùng lúc với log: Nutrition / Macros (cả `['nutrients','macros-series',…]`), Overview, Expenditure và Energy
 * Balance, Weight Trend insights (thâm hụt / dự báo dùng lượng ăn) và danh sách ngày của Nutrition Data Manager. MỖI phần tử là một họ khoá CỤ THỂ (không bao
 * giờ invalidate toàn cache); chỉ truy vấn đang mở mới tải lại. KHÔNG gồm `['goals']` (BE `GoalProgressCalculator` không đọc lượng ăn / Expenditure) và
 * `['check-in']` (staleTime 0, tải lại mỗi lần mở) — hai họ đó vẫn được làm mới khi job nền xong (`DERIVED_KEYS`, test N1).
 */
const LOG_DERIVED_KEYS = [
  ['nutrients'],
  ['nutrition-overview'],
  ['expenditure'],
  ['energy-balance'],
  ['weights', 'trend'],
  ['nutrition-data'],
] as const

/** Thêm / sửa / xoá món: làm mới log và mọi số suy ra từ log để Dashboard cập nhật ngay (không chờ hết staleTime). */
export function invalidateLogData(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: foodLogKeys.all })
  for (const queryKey of LOG_DERIVED_KEYS) void queryClient.invalidateQueries({ queryKey })
  // BE có thể còn dựng lại số dẫn xuất sau lần ghi này: đọc trạng thái một lần (màn dẫn xuất hiện khung xám nếu Updating)
  refreshDerivedStatus(queryClient)
}

/**
 * Chương trình / goal / check-in: target hiển thị ở nhật ký, Dashboard, Energy Balance, Expenditure và Overview đều đi theo chúng, cả target từng chất ở màn Food Detail
 * (`GET /foods/{id}/nutrients?date` dựng từ program + hồ sơ, giữ 5 phút).
 */
const TARGET_KEYS = [['program'], ['goals'], ['check-in'], ['foods', 'detail']] as const

/**
 * Tạo / sửa / đổi kiểu / TDEE thủ công / kết thúc program, Edit Goal và check-in Accept / Reject đổi target: làm mới program, goal, check-in
 * VÀ mọi số hiển thị theo target (cùng danh sách với `invalidateLogData`, MỘT nơi giữ danh sách này), nếu không target cũ nằm lại tới hết staleTime.
 */
export function invalidateTargetData(queryClient: QueryClient) {
  invalidateLogData(queryClient)
  for (const queryKey of TARGET_KEYS) void queryClient.invalidateQueries({ queryKey })
}

/**
 * Mọi chất của plate (và của ngày + plate) cho mục "Show all nutrients" của Your Plate. `enabled` = chỉ gọi khi mục đó đang mở;
 * khoá theo nội dung request nên thêm/bớt món hay đổi ngày mới gọi lại, giữ số cũ trong lúc tải để màn không nháy.
 */
export const usePlateNutrients = (request: PlateNutrientsRequest, enabled: boolean) =>
  useQuery({
    queryKey: [...foodLogKeys.all, 'plate-nutrients', request],
    queryFn: () => foodLogService.plateNutrients(request),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    retry: false,
  })

/** Thư viện của tôi (recipe / món tự tạo). `enabled` = chỉ tải khi tab Library đang mở. */
export const useLibrary = (params: LibraryParams, enabled: boolean) =>
  useQuery({
    queryKey: [...foodLogKeys.library, params],
    queryFn: () => foodLogService.getLibrary(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })

export const useCreateRecipe = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRecipeRequest) => foodLogService.createRecipe(payload),
    onSuccess: () => {
      toast.success('Recipe saved')
      // Recipe mới hiện ở Library, tìm kiếm món và Favorites của thanh thêm món
      for (const queryKey of [
        foodLogKeys.library,
        ['foods', 'search'],
        ['food-favorites'],
      ] as const)
        void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => logger.error(error),
  })
}

/** Create & Add: tạo recipe rồi ghi luôn vào log (hôm nay, giờ hiện tại, 1 khẩu phần) bằng một call. */
export const useCreateRecipeAndLog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAndLogRequest) => foodLogService.createRecipeAndLog(payload),
    onSuccess: () => {
      toast.success('Recipe saved and added')
      invalidateLogData(queryClient)
    },
    onError: (error) => logger.error(error),
  })
}

/** Dinh dưỡng của recipe đang soạn (tổng + trên mỗi khẩu phần); gọi lại khi đổi nguyên liệu hoặc số khẩu phần, giữ số cũ trong lúc tải. */
export const useRecipeNutrients = (request: RecipeNutrientsRequest, enabled: boolean) =>
  useQuery({
    queryKey: [...foodLogKeys.all, 'recipe-nutrients', request],
    queryFn: () => foodLogService.recipeNutrients(request),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    retry: false,
  })

export const useDayLog = (date: string | null) =>
  useQuery({
    queryKey: foodLogKeys.day(date ?? ''),
    queryFn: () => foodLogService.getDay(date ?? ''),
    enabled: Boolean(date),
  })

/** Một tuần bắt đầu ngày khác Thứ Hai nằm trên hai khối của BE (`weekBlocksOf`): gọi cả hai (khoá theo Thứ Hai của khối) rồi ghép theo `logDate`. */
interface WeekBlocks {
  readonly days: Readonly<Record<string, WeekDay>>
  readonly isLoading: boolean
  readonly error: Error | null
}

const combineBlocks = (results: UseQueryResult<WeekLog | null>[]): WeekBlocks => {
  const days: Record<string, WeekDay> = {}
  results.forEach((result) => result.data?.days.forEach((day) => (days[day.logDate] = day)))
  return {
    days,
    isLoading: results.some((result) => result.isLoading),
    error: results.find((result) => result.error)?.error ?? null,
  }
}

const useWeekBlocks = (weekStarts: readonly string[]) =>
  useQueries({
    queries: weekBlocksOf(weekStarts).map((block) => ({
      queryKey: foodLogKeys.week(block),
      queryFn: () => foodLogService.getWeek(block),
      staleTime: 60 * 1000,
    })),
    combine: combineBlocks,
  })

/**
 * Bảy ngày của tuần bắt đầu từ `weekStart` (ngày đầu tuần theo cài đặt của user) cho lưới Weekly Nutrition, theo thứ tự cột.
 * `days` chỉ có khi đủ cả bảy ngày (chưa tải xong hoặc lỗi thì undefined); `weekStart` null = không gọi.
 */
export const useWeekLog = (weekStart: string | null) => {
  const queryClient = useQueryClient()
  const { days, isLoading, error } = useWeekBlocks(weekStart ? [weekStart] : [])
  const week = weekStart ? weekDates(weekStart).map((date) => days[date]) : []
  return {
    days: week.length > 0 && week.every(Boolean) ? week : undefined,
    isLoading,
    isError: error !== null,
    error,
    // Chỉ các khối tuần của chính mình (không kéo theo mọi query food-log đang mở)
    refetch: () =>
      Promise.all(
        (weekStart ? weekBlocksOf([weekStart]) : []).map((block) =>
          queryClient.refetchQueries({ queryKey: foodLogKeys.week(block) })
        )
      ),
  }
}

/**
 * Tổng từng ngày của nhiều tuần (mỗi phần tử là ngày đầu tuần theo cài đặt của user) cho vòng kcal trên viên ngày của thanh tuần và lịch.
 * Gộp thành map ngày iso → WeekDay; ghi/xoá món invalidate `foodLogKeys.all` nên vòng tự cập nhật.
 */
export const useWeekDays = (weekStarts: readonly string[]) => useWeekBlocks(weekStarts).days

/**
 * Lỗi xoá / ghi log hiện bằng toast: 409 của BE (hai yêu cầu ghi chồng lên cùng một ngày, không kèm mã) hiện câu rõ ràng bằng tiếng Anh của FE thay vì
 * thông điệp thô; lỗi khác giữ `reportMutationError`.
 */
function reportLogError(error: unknown, title: string) {
  if (ndmReasonOf(error) === null) return reportMutationError(error, title)
  logger.error(error)
  toast.error(title, { description: ndmErrorMessage(error, getFormErrorMessage) })
}

/** Mọi thay đổi log ảnh hưởng tổng ngày của nhiều ngày (copy) → invalidate cả nhóm. */
const useLogMutation = <TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  successMessage?: string,
  /** Có = thao tác không có chỗ hiện lỗi inline (xoá): báo user bằng toast thay vì chỉ ghi log. */
  failureTitle?: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (successMessage) toast.success(successMessage)
      invalidateLogData(queryClient)
    },
    onError: (error) => {
      if (failureTitle) return reportLogError(error, failureTitle)
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}

/** Chọn nhiều món trên timeline: copy / chuyển / xoá hàng loạt; mỗi thao tác làm mới mọi ngày bị ảnh hưởng. Thông báo do trang đưa ra. */
export const useBulkCopy = () =>
  useLogMutation((payload: BulkCopyRequest) => foodLogService.bulkCopy(payload))
export const useBulkMove = () =>
  useLogMutation((payload: BulkMoveRequest) => foodLogService.bulkMove(payload))
export const useBulkDelete = () =>
  useLogMutation(
    (ids: string[]) => foodLogService.bulkDelete(ids),
    undefined,
    "Couldn't delete the selected foods"
  )

// Lỗi thêm món luôn báo bằng toast (BE: ghi song song / quá hạn chờ trả 409 CONCURRENT, 400…): trước đây chỉ `logger.error` nên một lần thêm thất bại không ai biết. Lỗi vẫn hiện
// inline trong bảng khi bảng đang mở.
export const useAddEntry = () =>
  useLogMutation(
    (payload: AddEntryRequest) => foodLogService.addEntry(payload),
    undefined,
    "Couldn't add food"
  )
export const useUpdateEntry = () =>
  useLogMutation(
    ({ id, payload }: { id: string; payload: UpdateEntryRequest }) =>
      foodLogService.updateEntry(id, payload),
    'Saved'
  )
/**
 * Xoá món không hỏi lại: gỡ món khỏi cache ngày ngay (timeline chạy hoạt ảnh biến mất) rồi mới gọi BE; lỗi thì trả lại cache cũ. Xong thì tải lại để
 * khớp số liệu BE. Tổng ngày KHÔNG bị FE trừ trước: tổng hiệu lực do BE quyết (ngày có manual override thì xoá món không đổi tổng; số "đang trừ dở" sẽ là
 * số BE không bao giờ trả), nên giữ tổng BE tới khi tải lại.
 */
export const useDeleteEntry = () => {
  const queryClient = useQueryClient()
  const dayKey = [...foodLogKeys.all, 'day']
  return useMutation({
    mutationFn: (id: string) => foodLogService.deleteEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: dayKey })
      const snapshot = queryClient.getQueriesData<DayLog>({ queryKey: dayKey })
      queryClient.setQueriesData<DayLog>({ queryKey: dayKey }, (day) => {
        if (!day?.entries.some((entry) => entry.id === id)) return day
        return { ...day, entries: day.entries.filter((entry) => entry.id !== id) }
      })
      return { snapshot }
    },
    onSuccess: () => toast.success('Food deleted'),
    onError: (error, _id, context) => {
      reportMutationError(error, "Couldn't delete this food")
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => invalidateLogData(queryClient),
  })
}
export const useQuickAdd = () =>
  useLogMutation(
    (payload: QuickAddRequest) => foodLogService.quickAdd(payload),
    'Added',
    "Couldn't add food"
  )
export const useCopyLog = () =>
  useLogMutation((payload: CopyRequest) => foodLogService.copy(payload))
export const useClearDay = () =>
  useLogMutation(
    (date: string) => foodLogService.clearDay(date),
    "Day's foods deleted",
    "Couldn't delete the day's foods"
  )

/** Ghi chú không đổi con số nào: chỉ nhật ký (ngày + tuần) làm mới, không đụng Nutrition / Expenditure / Goals (tránh tải lại thừa). */
const useNoteMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
  failureTitle?: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: foodLogKeys.all })
    },
    onError: (error) =>
      failureTitle ? reportMutationError(error, failureTitle) : logger.error(error),
  })
}
export const useAddNote = () =>
  useNoteMutation((payload: AddNoteRequest) => foodLogService.addNote(payload), 'Note added')
export const useUpdateNote = () =>
  useNoteMutation(
    ({ id, payload }: { id: string; payload: UpdateNoteRequest }) =>
      foodLogService.updateNote(id, payload),
    'Note saved'
  )
export const useDeleteNote = () =>
  useNoteMutation(
    (id: string) => foodLogService.deleteNote(id),
    'Note deleted',
    "Couldn't delete the note"
  )

/** Pha 1 của AI Plate: ảnh + mô tả → món và nguyên liệu (chưa có dinh dưỡng). Không ghi log nên không invalidate. */
export const useAiAnalyze = () =>
  useMutation({
    mutationFn: ({ photos, description }: { photos: File[]; description: string }) =>
      foodLogService.aiAnalyze(photos, description),
    onError: (error) => logger.error(error),
  })

/**
 * AI Plate hai pha: `analyze` lấy món + nguyên liệu, rồi mỗi nguyên liệu gọi `resolveIngredient` song song, trạng thái riêng từng
 * dòng (`states`). Gọi lại `analyze`/`reset` thì kết quả của lượt cũ bị bỏ (đếm lượt bằng `run`).
 */
export const useAiPlate = () => {
  const analyzeMutation = useAiAnalyze()
  const [dishes, setDishes] = useState<AiDish[] | null>(null)
  const [states, setStates] = useState<Record<string, IngredientState>>({})
  // Mã lần phân tích hiện tại cho bước confirm; reset cùng kết quả.
  const [scanId, setScanId] = useState<string | null>(null)
  // Chỉnh sửa của user (gram, xoá, thay món, số "plate"); mất khi phân tích lại hoặc bắt đầu lại
  const [edits, setEdits] = useState<AiPlateEdits>(EMPTY_AI_EDITS)
  const run = useRef(0)

  const setState = (id: string, state: IngredientState) =>
    setStates((current) => ({ ...current, [id]: state }))

  const resolve = (ingredient: AiIngredient, runId: number) => {
    setState(ingredient.id, { status: 'searching' })
    foodLogService
      .resolveIngredient({
        name: ingredient.name,
        grams: ingredient.grams,
        quantity: ingredient.quantity ?? null,
        unit: ingredient.unit ?? null,
        state: ingredient.state ?? null,
      })
      .then((data) => {
        if (run.current === runId)
          setState(
            ingredient.id,
            data && (data.matched || data.estimated)
              ? { status: 'matched', data }
              : { status: 'not-found' }
          )
      })
      .catch((error: unknown) => {
        logger.error(error)
        if (run.current === runId) setState(ingredient.id, { status: 'error' })
      })
  }

  const analyze = (input: { photos: File[]; description: string }) =>
    analyzeMutation.mutate(input, {
      onSuccess: (response) => {
        const runId = ++run.current
        setStates({})
        setEdits(EMPTY_AI_EDITS)
        const found = response?.dishes ?? []
        setDishes(found)
        setScanId(response?.scanId ?? null)
        found.forEach((dish) => dish.ingredients.forEach((item) => resolve(item, runId)))
      },
    })

  const reset = () => {
    run.current += 1
    setDishes(null)
    setStates({})
    setScanId(null)
    setEdits(EMPTY_AI_EDITS)
    analyzeMutation.reset()
  }

  const editIngredient = (id: string, patch: IngredientEdit) =>
    setEdits((current) => ({
      ...current,
      ingredients: { ...current.ingredients, [id]: { ...current.ingredients[id], ...patch } },
    }))

  /**
   * Báo BE món user đã chọn cho từng nguyên liệu AI khi log kết quả. Best-effort: chỉ gọi khi có scanId, và lỗi (404 scan lạ,
   * 409 hết hạn, mạng) bị nuốt vì không được chặn việc thêm vào plate. Gọi lại cùng scan là idempotent.
   */
  const confirm = (ingredients: AiConfirmIngredient[]) => {
    if (!scanId || ingredients.length === 0) return
    void foodLogService
      .aiConfirm({ scanId, ingredients })
      .catch((error: unknown) => logger.warn('AI confirm failed (ignored):', error))
  }

  return {
    dishes,
    states,
    isAnalyzing: analyzeMutation.isPending,
    error: analyzeMutation.error,
    analyze,
    edits,
    setIngredientGrams: (id: string, grams: number, serving?: IngredientEdit['serving']) =>
      editIngredient(id, { grams, serving }),
    removeIngredient: (id: string) => editIngredient(id, { removed: true }),
    replaceIngredient: (id: string, replacement: ResolvedIngredient) =>
      editIngredient(id, { replacement, grams: undefined, serving: undefined }),
    setDishScale: (dishId: string, scale: number) =>
      setEdits((current) => ({
        ...current,
        dishScales: { ...current.dishScales, [dishId]: scale },
      })),
    retryIngredient: (item: AiIngredient) => resolve(item, run.current),
    confirm,
    reset,
  }
}
