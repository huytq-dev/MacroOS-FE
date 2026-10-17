import { z } from 'zod'

// Khớp BE UpsertWeightEntryCommandValidator
export const logWeightSchema = z.object({
  logDate: z.string().min(1, 'Choose a date'),
  weightKg: z
    .number({ error: 'Enter your weight' })
    .min(20, 'At least 20 kg')
    .max(400, 'Max 400 kg'),
})

export type LogWeightFormValues = z.infer<typeof logWeightSchema>
