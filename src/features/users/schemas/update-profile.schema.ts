import { z } from 'zod'
import { ACTIVITY_LEVEL, DAY_OF_WEEK, ENERGY_UNIT, GENDER, UNIT_SYSTEM } from '@/config/enums'

const keys = <T extends Record<string, string>>(labels: T) =>
  Object.keys(labels) as [keyof T & string, ...(keyof T & string)[]]

// Khớp BE UpdateProfileCommandValidator. Ngày sinh / chiều cao CHƯA CÓ thì để trống (không bịa số): chỉ kiểm khoảng khi có giá trị, và
// `profileUpdatePayload` chỉ gửi trường người dùng thực sự sửa. Program vẫn cần cả hai (BE kiểm khi tạo program).
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Enter your first name').max(100),
  lastName: z.string().min(1, 'Enter your last name').max(100),
  dateOfBirth: z.string(),
  gender: z.enum(keys(GENDER)),
  heightCm: z
    .number({ error: 'Enter your height' })
    .min(50, 'Minimum 50 cm')
    .max(300, 'Maximum 300 cm')
    .optional(),
  activityLevel: z.enum(keys(ACTIVITY_LEVEL)),
  unitPreference: z.enum(keys(UNIT_SYSTEM)),
  energyUnit: z.enum(keys(ENERGY_UNIT)),
  weekStartDay: z.enum(keys(DAY_OF_WEEK)),
  timeZone: z.string().max(100).optional(),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>

/** Những gì BE ĐÃ CÓ của người dùng: trường đã có giá trị thì không được xoá trống (xoá không thể lưu, chỉ gây Save "không làm gì"). */
export interface KnownProfileFields {
  readonly dateOfBirth: boolean
  readonly heightCm: boolean
}

/**
 * Schema của form hồ sơ theo dữ liệu hiện có: ngày sinh / chiều cao CHƯA TỪNG có thì được để trống (người dùng vẫn lưu được các trường
 * khác, không bắt nhập số bịa); ĐÃ CÓ thì bắt buộc như trước (xoá trống báo lỗi thay vì lưu im lặng không đổi gì).
 */
export const profileSchemaFor = (known: KnownProfileFields) =>
  updateProfileSchema.superRefine((values, context) => {
    if (known.dateOfBirth && !values.dateOfBirth)
      context.addIssue({
        code: 'custom',
        path: ['dateOfBirth'],
        message: 'Select your date of birth',
      })
    if (known.heightCm && values.heightCm === undefined)
      context.addIssue({ code: 'custom', path: ['heightCm'], message: 'Enter your height' })
  })
