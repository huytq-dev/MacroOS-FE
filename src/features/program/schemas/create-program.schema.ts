import { z } from 'zod'
import { DAY_OF_WEEK, DIET_STYLE, GOAL_TYPE, PROGRAM_TYPE, PROTEIN_LEVEL } from '@/config/enums'

const keys = <T extends Record<string, string>>(labels: T) =>
  Object.keys(labels) as [keyof T & string, ...(keyof T & string)[]]

// Khớp BE CreateProgramCommandValidator. Rate nhập dương (%/tuần); BE tự đặt dấu theo goal.
export const createProgramSchema = z
  .object({
    goalType: z.enum(keys(GOAL_TYPE)),
    weeklyWeightChangeTargetPercent: z.number({ error: 'Nhập tốc độ' }).min(0).max(1.5, 'Tối đa 1.5 %/tuần'),
    programType: z.enum(keys(PROGRAM_TYPE)),
    dietStyle: z.enum(keys(DIET_STYLE)),
    proteinLevel: z.enum(keys(PROTEIN_LEVEL)),
    calorieFloorEnabled: z.boolean(),
    calorieFloorKcal: z.number().min(800, 'Từ 800').max(3000, 'Tối đa 3000'),
    checkInWeekday: z.enum(keys(DAY_OF_WEEK)),
    manualTdeeEnabled: z.boolean(),
    manualInitialTdeeKcal: z.number().min(1000, 'Từ 1000').max(6000, 'Tối đa 6000'),
  })
  .refine((values) => values.goalType !== 'Maintenance' || values.weeklyWeightChangeTargetPercent === 0, {
    message: 'Giữ cân thì tốc độ phải bằng 0',
    path: ['weeklyWeightChangeTargetPercent'],
  })

export type CreateProgramFormValues = z.infer<typeof createProgramSchema>
