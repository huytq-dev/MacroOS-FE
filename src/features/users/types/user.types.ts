import type { ActivityLevel, Gender, UnitSystem } from '@/config/enums'

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
  bio: string | null
  timeZone: string | null
  locale: string | null
  emailVerified: boolean
  /** Ngày tạo tài khoản (ISO). BE sẽ trả thêm; chưa có thì undefined. */
  createdAt?: string
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
  bio?: string | null
  timeZone?: string | null
  locale?: string | null
}
