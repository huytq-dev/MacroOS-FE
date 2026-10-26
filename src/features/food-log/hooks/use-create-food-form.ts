'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { mealForTime } from '@/config/enums'
import { routePath } from '@/config/route-path'
import { useCreateFood } from '@/features/foods/hooks/use-foods'
import type { FoodDetail } from '@/features/foods/types/food.types'
import { nowClockIso, todayIso } from '@/lib/date'
import { useUiStore } from '@/stores/ui.store'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import {
  buildRequest,
  formatValue,
  gramsToLog,
  initialState,
  parseNumber,
  seedState,
  switchBasis,
  type MacroSeed,
  unitFactor,
  type CreateFoodState,
  type FieldErrors,
} from '../create-food.utils'
import type { Basis } from '../create-food.config'
import { useAddEntry } from './use-food-log'

const withoutKey = (errors: FieldErrors, key: string): FieldErrors => {
  if (!(key in errors)) return errors
  const rest = { ...errors }
  delete rest[key]
  return rest
}

/**
 * Form Create Food: trạng thái các ô (chuỗi, đúng như người dùng thấy), đổi cơ sở / đơn vị mà giữ nguyên hàm lượng thật, kiểm tra
 * theo luật của BE rồi `POST /foods`. "Create & Add" ghi luôn một khẩu phần (hoặc 100 g) vào nhật ký hôm nay lúc này.
 */
export function useCreateFoodForm(source?: FoodDetail, seed?: MacroSeed) {
  const router = useRouter()
  const [state, setState] = useState<CreateFoodState>(() =>
    source ? initialState(source) : seed ? seedState(seed) : initialState()
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const createFood = useCreateFood()
  const addEntry = useAddEntry()

  const patch = (partial: Partial<CreateFoodState>) => {
    setState((current) => ({ ...current, ...partial }))
    setErrors((current) => Object.keys(partial).reduce(withoutKey, current))
    if ('servingName' in partial || 'servingQty' in partial || 'weight' in partial)
      setErrors((current) => withoutKey(current, 'serving'))
  }

  const setValue = (key: string, text: string) => {
    setState((current) => ({ ...current, values: { ...current.values, [key]: text } }))
    setErrors((current) => withoutKey(withoutKey(current, key), 'fat'))
  }

  /** Đổi đơn vị của một hàng thì quy lại số đang gõ để hàm lượng thật không đổi (1000 mg → 1 g). */
  const setUnit = (key: string, label: string) =>
    setState((current) => {
      const number = parseNumber(current.values[key] ?? '')
      const converted =
        number === null
          ? (current.values[key] ?? '')
          : formatValue(
              (number * unitFactor(key, current.units)) / unitFactor(key, current.units, label)
            )
      return {
        ...current,
        units: { ...current.units, [key]: label },
        values: { ...current.values, [key]: converted },
      }
    })

  const setBasis = (basis: Basis) => setState((current) => switchBasis(current, basis))

  const submit = async (andAdd: boolean) => {
    const result = buildRequest(state)
    if (result.errors) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    try {
      const id = (await createFood.mutateAsync(result.request)) as string
      // Đã tạo món: không quay về Food Detail của món nguồn nữa
      useUiStore.getState().clearDetailReturn()
      if (andAdd) {
        const time = nowClockIso().slice(0, 5)
        // Khẩu phần vừa tạo chưa có id ở FE nên ghi theo gram (BE: foodServingId null → quantity là gram)
        await addEntry.mutateAsync({
          logDate: todayIso(),
          mealType: mealForTime(time),
          eatenAt: `${time}:00`,
          foodItemId: id,
          foodServingId: null,
          quantity: Math.round(gramsToLog(state) * 100) / 100,
        })
        router.push(routePath.foodLog)
      } else {
        router.back()
      }
    } catch {
      // lỗi nghiệp vụ hiện inline ở đầu trang (serverError); các ô giữ nguyên để sửa
    }
  }

  const serverError = createFood.error ?? addEntry.error
  return {
    state,
    errors,
    patch,
    setValue,
    setUnit,
    setBasis,
    submit,
    isPending: createFood.isPending || addEntry.isPending,
    serverError: serverError ? getFormErrorMessage(serverError) : null,
  }
}
