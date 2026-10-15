import { z } from 'zod'

// Khớp BE UpsertWeightEntryCommandValidator
export const logWeightSchema = z.object({
  logDate: z.string().min(1, 'Chọn ngày'),
  weightKg: z.number({ error: 'Nhập cân nặng' }).min(20, 'Từ 20 kg').max(400, 'Tối đa 400 kg'),
  notes: z.string().max(500, 'Tối đa 500 ký tự').optional(),
})

export type LogWeightFormValues = z.infer<typeof logWeightSchema>
