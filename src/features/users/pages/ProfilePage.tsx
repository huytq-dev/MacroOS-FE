'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProfile, useUpdateProfile } from '../hooks/use-profile'
import { profileUpdatePayload } from '../profile.utils'
import { profileSchemaFor, type UpdateProfileFormValues } from '../schemas/update-profile.schema'
import { ProfileForm } from '../components/ProfilePage'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfilePage() {
  const profile = useProfile()
  const updateProfile = useUpdateProfile()
  const { user, logout } = useAuth()

  const form = useForm<UpdateProfileFormValues>({
    // Schema theo dữ liệu hiện có (đọc lúc kiểm): trường đã có giá trị thì không được xoá trống, chưa từng có thì được để trống
    resolver: (values, context, options) =>
      zodResolver(
        profileSchemaFor({
          dateOfBirth: Boolean(profile.data?.dateOfBirth),
          heightCm: profile.data?.heightCm != null,
        })
      )(values, context, options),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      heightCm: undefined,
      activityLevel: 'LightlyActive',
      unitPreference: 'Metric',
      energyUnit: 'Kcal',
      weekStartDay: 'Monday',
      timeZone: '',
    },
  })

  // Đổ dữ liệu BE vào form sau khi tải; reset cũng đặt lại trạng thái "chưa có thay đổi"
  useEffect(() => {
    if (!profile.data) return
    form.reset({
      firstName: profile.data.firstName,
      lastName: profile.data.lastName,
      dateOfBirth: profile.data.dateOfBirth ?? '',
      gender: profile.data.gender,
      // Chưa có chiều cao thì để trống (hiện "Not set"), không điền số mặc định
      heightCm: profile.data.heightCm ?? undefined,
      activityLevel: profile.data.activityLevel,
      unitPreference: profile.data.unitPreference,
      energyUnit: profile.data.energyUnit,
      weekStartDay: profile.data.weekStartDay,
      timeZone: profile.data.timeZone ?? '',
    })
  }, [profile.data, form])

  if (profile.isError)
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="Profile" eyebrow={user?.email} />
      {profile.isLoading ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : (
        <ProfileForm
          form={form}
          isPending={updateProfile.isPending}
          error={updateProfile.error ? getFormErrorMessage(updateProfile.error) : null}
          // Chỉ gửi các trường người dùng đã sửa: giá trị chưa biết không bao giờ bị thay bằng số mặc định
          onSubmit={(values) => {
            const payload = profileUpdatePayload(values, form.formState.dirtyFields)
            if (Object.keys(payload).length > 0) updateProfile.mutate(payload)
          }}
          onLogout={() => void logout()}
        />
      )}
    </div>
  )
}
