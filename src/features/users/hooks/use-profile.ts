'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userService } from '../services/user.service'
import type { UpdateProfileRequest } from '../types/user.types'
import { invalidateTargetData } from '@/features/food-log/hooks/use-food-log'
import { weightKeys } from '@/features/weight/hooks/use-weights'
import { logger } from '@/lib/api'
import { setEffectiveTimeZone } from '@/lib/date'

export const profileKeys = { me: ['profile', 'me'] as const }

/**
 * Trường hồ sơ mà BE dùng để TÍNH: ngày sinh / giới tính (mục tiêu vi chất theo tuổi, giới), chiều cao / mức vận động (program), ngày đầu tuần và múi giờ
 * (bucket tuần, "hôm nay"). Đổi chúng thì mọi số suy ra phải đọc lại; đơn vị (kg / lb, kcal / kJ), tên và bio chỉ là hiển thị.
 */
const CALCULATION_FIELDS = [
  'dateOfBirth',
  'gender',
  'heightCm',
  'activityLevel',
  'weekStartDay',
  'timeZone',
] as const

/** `null` = giữ nguyên (hợp đồng BE) nên chỉ giá trị có nghĩa mới tính là đổi. */
export const profileChangeAffectsData = (payload: UpdateProfileRequest): boolean =>
  CALCULATION_FIELDS.some((field) => payload[field] !== undefined && payload[field] !== null)

/** Trường làm đổi lịch (cách gộp tuần, ngày "hôm nay") chứ không chỉ công thức tính. */
const CALENDAR_FIELDS = ['weekStartDay', 'timeZone'] as const

/** Họ khoá theo ngày / tuần ngoài danh sách `invalidateTargetData`: làm mới khi lịch đổi (từng họ, không invalidate toàn cache). */
export const CALENDAR_KEYS = [
  ['steps'],
  ['periods'],
  ['progress-photos'],
  ['body-metrics'],
  ['visual-body-fat'],
  ['measurements'],
  ['nutrition-data'],
] as const

export const profileChangeShiftsCalendar = (payload: UpdateProfileRequest): boolean =>
  CALENDAR_FIELDS.some((field) => payload[field] !== undefined && payload[field] !== null)

/** Đọc hồ sơ rồi đặt ngay múi giờ nghiệp vụ cho `todayIso()` (trước khi bất kỳ chỗ nào nhận dữ liệu) để "hôm nay" của FE khớp BE. */
const fetchProfile = async () => {
  const profile = await userService.getProfile()
  setEffectiveTimeZone(profile?.effectiveTimeZone)
  return profile
}

export const useProfile = () =>
  useQuery({ queryKey: profileKeys.me, queryFn: fetchProfile, staleTime: 5 * 60 * 1000 })

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userService.updateProfile(payload),
    onSuccess: (_data, payload) => {
      toast.success('Profile saved')
      void queryClient.invalidateQueries({ queryKey: profileKeys.me })
      if (profileChangeAffectsData(payload)) {
        invalidateTargetData(queryClient)
        void queryClient.invalidateQueries({ queryKey: weightKeys.all })
      }
      // Đổi ngày đầu tuần / múi giờ làm đổi cách gộp tuần và ngày "hôm nay" của MỌI danh sách theo ngày
      if (profileChangeShiftsCalendar(payload))
        for (const queryKey of CALENDAR_KEYS) void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}
