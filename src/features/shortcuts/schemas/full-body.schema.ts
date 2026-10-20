import { z } from 'zod'

// Khớp BE validator của PUT / PATCH /body-metrics/full-body: % mỡ 2–70, mỗi ô đo trong khoảng riêng (cm), ô trống = xoá ô đó
const tapeCm = (label: string, min: number, max: number) =>
  z
    .number({ error: `Enter ${label} as a number` })
    .min(min, `${label} must be between ${min} and ${max} cm`)
    .max(max, `${label} must be between ${min} and ${max} cm`)
    .nullable()

export const fullBodySchema = z.object({
  date: z.string().min(1, 'Choose a date'),
  visualBodyFatPercent: z
    .number({ error: 'Enter body fat as a number' })
    .min(2, 'Body fat must be between 2% and 70%')
    .max(70, 'Body fat must be between 2% and 70%')
    .nullable(),
  tape: z
    .object({
      neckCm: tapeCm('Neck', 20, 70),
      shouldersCm: tapeCm('Shoulders', 60, 200),
      bustCm: tapeCm('Bust', 50, 200),
      chestCm: tapeCm('Chest', 50, 200),
      waistCm: tapeCm('Waist', 40, 250),
      hipCm: tapeCm('Hips', 50, 250),
      leftArmCm: tapeCm('Left Bicep', 10, 80),
      rightArmCm: tapeCm('Right Bicep', 10, 80),
      leftForearmCm: tapeCm('Left Forearm', 10, 60),
      rightForearmCm: tapeCm('Right Forearm', 10, 60),
      leftWristCm: tapeCm('Left Wrist', 8, 35),
      rightWristCm: tapeCm('Right Wrist', 8, 35),
      leftThighCm: tapeCm('Left Thigh', 20, 120),
      rightThighCm: tapeCm('Right Thigh', 20, 120),
      leftCalfCm: tapeCm('Left Calf', 15, 80),
      rightCalfCm: tapeCm('Right Calf', 15, 80),
      leftAnkleCm: tapeCm('Left Ankle', 10, 45),
      rightAnkleCm: tapeCm('Right Ankle', 10, 45),
    })
    .partial()
    .nullable(),
})

export type FullBodyFormValues = z.infer<typeof fullBodySchema>
