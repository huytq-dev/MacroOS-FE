import { z } from 'zod'

// Khớp BE validator của PUT /body-metrics/full-body: % mỡ 2–75, mỗi ô đo 5–300 cm, ô trống = xoá ô đó
const tapeCm = z
  .number({ error: 'Enter a number' })
  .min(5, 'Measurements must be at least 5 cm')
  .max(300, 'Measurements must be at most 300 cm')
  .nullable()

export const fullBodySchema = z.object({
  date: z.string().min(1, 'Choose a date'),
  visualBodyFatPercent: z
    .number({ error: 'Enter body fat as a number' })
    .min(2, 'Body fat must be between 2% and 75%')
    .max(75, 'Body fat must be between 2% and 75%')
    .nullable(),
  tape: z
    .object({
      neckCm: tapeCm,
      shouldersCm: tapeCm,
      bustCm: tapeCm,
      chestCm: tapeCm,
      waistCm: tapeCm,
      hipCm: tapeCm,
      leftArmCm: tapeCm,
      rightArmCm: tapeCm,
      leftForearmCm: tapeCm,
      rightForearmCm: tapeCm,
      leftWristCm: tapeCm,
      rightWristCm: tapeCm,
      leftThighCm: tapeCm,
      rightThighCm: tapeCm,
      leftCalfCm: tapeCm,
      rightCalfCm: tapeCm,
      leftAnkleCm: tapeCm,
      rightAnkleCm: tapeCm,
    })
    .partial()
    .nullable(),
})

export type FullBodyFormValues = z.infer<typeof fullBodySchema>
