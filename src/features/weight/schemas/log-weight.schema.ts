import { z } from 'zod'
import type { WeightUnit } from '@/lib/units'
import { weightLimits } from './body-metric.schema'

// Khớp BE UpsertWeightEntryCommandValidator. `weight` là số user gõ theo đơn vị CỦA HỌ (kg / lb); đổi sang kg bằng `toApiKg` khi gửi.
export const logWeightSchema = (unit: WeightUnit) => {
  const { min, max } = weightLimits(unit)
  return z.object({
    logDate: z.string().min(1, 'Choose a date'),
    weight: z
      .number({ error: 'Enter your weight' })
      .min(min, `At least ${min} ${unit}`)
      .max(max, `Max ${max} ${unit}`),
  })
}

export type LogWeightFormValues = z.infer<ReturnType<typeof logWeightSchema>>
