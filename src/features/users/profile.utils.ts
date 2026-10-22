import type { UpdateProfileFormValues } from './schemas/update-profile.schema'
import type { UpdateProfileRequest } from './types/user.types'

/**
 * Giá trị của ô số trong form (`register(..., { setValueAs })`): ô trống = chưa có (undefined), KHÔNG phải NaN — `valueAsNumber` trả NaN cho ô
 * trống và zod từ chối NaN ("Enter your height"), khiến người dùng chưa có chiều cao không lưu được bất kỳ trường nào khác.
 */
export const optionalNumberValue = (raw: unknown): number | undefined => {
  if (raw === '' || raw === null || raw === undefined) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

/**
 * Body `PUT /users/me` từ form hồ sơ: CHỈ gồm các trường người dùng thực sự đã sửa (RHF `dirtyFields`); BE hiểu trường vắng = giữ nguyên.
 * Giá trị chưa biết (chiều cao / ngày sinh chưa có) không bao giờ bị thay bằng số mặc định: trường để trống hoặc không phải số
 * thì bị bỏ khỏi body chứ không gửi. Múi giờ rỗng gửi null: BE hiện hiểu null là "giữ nguyên" nên CHƯA xoá được múi giờ qua API này
 * (sẽ xử lý cùng đợt múi giờ ở BE).
 */
export function profileUpdatePayload(
  values: UpdateProfileFormValues,
  dirty: Partial<Record<keyof UpdateProfileFormValues, boolean>>
): UpdateProfileRequest {
  const payload: UpdateProfileRequest = {}
  if (dirty.firstName) payload.firstName = values.firstName
  if (dirty.lastName) payload.lastName = values.lastName
  if (dirty.dateOfBirth && values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth
  if (dirty.gender) payload.gender = values.gender
  if (dirty.heightCm && typeof values.heightCm === 'number' && Number.isFinite(values.heightCm))
    payload.heightCm = values.heightCm
  if (dirty.activityLevel) payload.activityLevel = values.activityLevel
  if (dirty.unitPreference) payload.unitPreference = values.unitPreference
  if (dirty.energyUnit) payload.energyUnit = values.energyUnit
  if (dirty.weekStartDay) payload.weekStartDay = values.weekStartDay
  if (dirty.timeZone) payload.timeZone = values.timeZone || null
  return payload
}
