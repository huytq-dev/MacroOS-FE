import type { ActivityLevel, DayOfWeek, Gender, UnitSystem } from '@/config/enums'
import type { EnergyUnitSetting } from '@/lib/units'

// Khớp BE Contract/Models/Users/GetProfileResponse.cs
export interface Profile {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  gender: Gender
  dateOfBirth: string | null
  heightCm: number | null
  activityLevel: ActivityLevel
  unitPreference: UnitSystem
  /** Kcal | Kj: chỉ là cài đặt hiển thị, mọi số liệu BE vẫn là kcal. */
  energyUnit: EnergyUnitSetting
  /** Ngày đầu tuần của mọi thống kê / dải tuần (tên DayOfWeek, mặc định Monday). */
  weekStartDay: DayOfWeek
  bio: string | null
  timeZone: string | null
  /** Múi giờ BE thực sự dùng cho "hôm nay" / tuần (múi giờ hồ sơ, hoặc "UTC" khi dự phòng). Thiếu ở BE cũ → FE dùng giờ máy. */
  effectiveTimeZone?: string | null
  /** null = đang dùng đúng múi giờ hồ sơ; "Missing" = hồ sơ chưa đặt; "Invalid" = id không tồn tại (BE dự phòng UTC): FE nhắc user chọn múi giờ. */
  timeZoneFallback?: 'Missing' | 'Invalid' | null
  locale: string | null
  emailVerified: boolean
  /** Ngày tạo tài khoản (ISO), hiện "Member Since". */
  createdAt: string
}

// Khớp BE UpdateProfileCommand (null = giữ nguyên)
export interface UpdateProfileRequest {
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  gender?: Gender | null
  heightCm?: number | null
  activityLevel?: ActivityLevel | null
  unitPreference?: UnitSystem | null
  energyUnit?: EnergyUnitSetting | null
  weekStartDay?: DayOfWeek | null
  bio?: string | null
  timeZone?: string | null
  locale?: string | null
}
