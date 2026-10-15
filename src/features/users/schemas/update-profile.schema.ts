import { z } from 'zod'
import { ACTIVITY_LEVEL, GENDER, UNIT_SYSTEM } from '@/config/enums'

const keys = <T extends Record<string, string>>(labels: T) =>
  Object.keys(labels) as [keyof T & string, ...(keyof T & string)[]]

// Khớp BE UpdateProfileCommandValidator; DOB + chiều cao bắt buộc ở FE vì program cần (BR CreateProgram)
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập tên').max(100),
  lastName: z.string().min(1, 'Vui lòng nhập họ').max(100),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(keys(GENDER)),
  heightCm: z.number({ error: 'Nhập chiều cao' }).min(50, 'Từ 50 cm').max(300, 'Tối đa 300 cm'),
  activityLevel: z.enum(keys(ACTIVITY_LEVEL)),
  unitPreference: z.enum(keys(UNIT_SYSTEM)),
  timeZone: z.string().max(100).optional(),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
