import { z } from 'zod'

export const LB_PER_KG = 2.2046226

// Khớp BE UpsertWeightEntryCommandValidator (20–400 kg); lb đổi giới hạn tương ứng
export const weightValueSchema = (unit: 'kg' | 'lb') =>
  unit === 'kg'
    ? z.number().min(20, 'At least 20 kg').max(400, 'Max 400 kg')
    : z.number().min(44, 'At least 44 lb').max(881, 'Max 881 lb')

// Khớp BE UpsertBodyFatCommandValidator (2–70 %)
export const bodyFatValueSchema = z.number().min(2, 'At least 2%').max(70, 'Max 70%')
