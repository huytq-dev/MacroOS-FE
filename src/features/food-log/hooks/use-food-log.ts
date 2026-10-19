'use client'

import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SAMPLE_AI_PLATE } from '../components/FoodLogPage/ai-sample'
import { EMPTY_AI_EDITS, type AiPlateEdits, type IngredientEdit } from '../ai-plate.utils'
import { foodLogService } from '../services/food-log.service'
import type {
  AddEntryRequest,
  AddNoteRequest,
  AiConfirmIngredient,
  AiDish,
  AiIngredient,
  CopyRequest,
  CreateRecipeRequest,
  DayLog,
  IngredientState,
  LibraryParams,
  PlateNutrientsRequest,
  QuickAddRequest,
  ResolvedIngredient,
  UpdateEntryRequest,
  UpdateNoteRequest,
} from '../types/food-log.types'
import { logger } from '@/lib/api'

export const foodLogKeys = {
  all: ['food-log'] as const,
  day: (date: string) => ['food-log', 'day', date] as const,
  week: (date: string) => ['food-log', 'week', date] as const,
  library: ['food-log', 'library'] as const,
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
      void queryClient.invalidateQueries({ queryKey: foodLogKeys.library })
    },
    onError: (error) => logger.error(error),
  })
}

export const useDayLog = (date: string | null) =>
  useQuery({
    queryKey: foodLogKeys.day(date ?? ''),
    queryFn: () => foodLogService.getDay(date ?? ''),
    enabled: Boolean(date),
  })

export const useWeekLog = (date: string | null) =>
  useQuery({
    queryKey: foodLogKeys.week(date ?? ''),
    queryFn: () => foodLogService.getWeek(date ?? ''),
    enabled: Boolean(date),
  })

/** Mọi thay đổi log ảnh hưởng tổng ngày của nhiều ngày (copy) → invalidate cả nhóm. */
const useLogMutation = <TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  successMessage?: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (successMessage) toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: foodLogKeys.all })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}

export const useAddEntry = () =>
  useLogMutation((payload: AddEntryRequest) => foodLogService.addEntry(payload))
export const useUpdateEntry = () =>
  useLogMutation(
    ({ id, payload }: { id: string; payload: UpdateEntryRequest }) =>
      foodLogService.updateEntry(id, payload),
    'Saved'
  )
/**
 * Xoá món không hỏi lại: gỡ món khỏi cache ngày ngay (timeline chạy hoạt ảnh biến mất, tổng ngày trừ luôn) rồi mới gọi BE;
 * lỗi thì trả lại cache cũ. Xong thì tải lại để khớp số liệu BE.
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
        const gone = day?.entries.find((entry) => entry.id === id)
        if (!day || !gone) return day
        const minus = (total: number, value: number | null) => Math.max(0, total - (value ?? 0))
        return {
          ...day,
          entries: day.entries.filter((entry) => entry.id !== id),
          totals: {
            calories: minus(day.totals.calories, gone.calories),
            protein: minus(day.totals.protein, gone.protein),
            carbs: minus(day.totals.carbs, gone.carbs),
            fat: minus(day.totals.fat, gone.fat),
            fiber: minus(day.totals.fiber, gone.fiber),
          },
        }
      })
      return { snapshot }
    },
    onSuccess: () => toast.success('Food deleted'),
    onError: (error, _id, context) => {
      logger.error(error)
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: foodLogKeys.all }),
  })
}
export const useQuickAdd = () =>
  useLogMutation((payload: QuickAddRequest) => foodLogService.quickAdd(payload), 'Added')
export const useCopyLog = () =>
  useLogMutation((payload: CopyRequest) => foodLogService.copy(payload))
export const useClearDay = () =>
  useLogMutation((date: string) => foodLogService.clearDay(date), "Day's log deleted")

export const useAddNote = () =>
  useLogMutation((payload: AddNoteRequest) => foodLogService.addNote(payload), 'Note added')
export const useUpdateNote = () =>
  useLogMutation(
    ({ id, payload }: { id: string; payload: UpdateNoteRequest }) =>
      foodLogService.updateNote(id, payload),
    'Note saved'
  )
export const useDeleteNote = () =>
  useLogMutation((id: string) => foodLogService.deleteNote(id), 'Note deleted')

/** Pha 1 của AI Plate: ảnh + mô tả → món và nguyên liệu (chưa có dinh dưỡng). Không ghi log nên không invalidate. */
export const useAiAnalyze = () =>
  useMutation({
    mutationFn: ({ photos, description }: { photos: File[]; description: string }) =>
      foodLogService.aiAnalyze(photos, description),
    onError: (error) => logger.error(error),
  })

const SAMPLE_DELAY_MS = 700
const SAMPLE_STEP_MS = 900

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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const setState = (id: string, state: IngredientState) =>
    setStates((current) => ({ ...current, [id]: state }))

  const resolve = (ingredient: AiIngredient, runId: number) => {
    setState(ingredient.id, { status: 'searching' })
    foodLogService
      .resolveIngredient({ name: ingredient.name, grams: ingredient.grams })
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
    clearTimers()
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

  // ponytail: chỉ để xem thiết kế khi BE chưa có API; xoá cùng ai-sample.ts khi BE có endpoint.
  const previewSample = () => {
    reset()
    const runId = run.current
    setDishes(SAMPLE_AI_PLATE.dishes)
    SAMPLE_AI_PLATE.dishes
      .flatMap((dish) => dish.ingredients)
      .forEach((item, index) => {
        setState(item.id, { status: 'searching' })
        timers.current.push(
          setTimeout(
            () => {
              if (run.current !== runId) return
              const data = SAMPLE_AI_PLATE.resolved[item.id]
              setState(
                item.id,
                data.matched ? { status: 'matched', data } : { status: 'not-found' }
              )
            },
            SAMPLE_DELAY_MS + index * SAMPLE_STEP_MS
          )
        )
      })
  }

  return {
    dishes,
    states,
    isAnalyzing: analyzeMutation.isPending,
    error: analyzeMutation.error,
    analyze,
    edits,
    setIngredientGrams: (id: string, grams: number) => editIngredient(id, { grams }),
    removeIngredient: (id: string) => editIngredient(id, { removed: true }),
    replaceIngredient: (id: string, replacement: ResolvedIngredient) =>
      editIngredient(id, { replacement, grams: undefined }),
    setDishScale: (dishId: string, scale: number) =>
      setEdits((current) => ({
        ...current,
        dishScales: { ...current.dishScales, [dishId]: scale },
      })),
    retryIngredient: (item: AiIngredient) => resolve(item, run.current),
    confirm,
    reset,
    previewSample,
  }
}
