'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProfile, useUpdateProfile } from '../hooks/use-profile'
import { updateProfileSchema, type UpdateProfileFormValues } from '../schemas/update-profile.schema'
import { ProfileForm } from '../components/ProfilePage'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfilePage() {
  const profile = useProfile()
  const updateProfile = useUpdateProfile()

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      heightCm: 170,
      activityLevel: 'LightlyActive',
      unitPreference: 'Metric',
      timeZone: '',
    },
  })

  // Đổ dữ liệu BE vào form sau khi tải
  useEffect(() => {
    if (!profile.data) return
    form.reset({
      firstName: profile.data.firstName,
      lastName: profile.data.lastName,
      dateOfBirth: profile.data.dateOfBirth ?? '',
      gender: profile.data.gender,
      heightCm: profile.data.heightCm ?? 170,
      activityLevel: profile.data.activityLevel,
      unitPreference: profile.data.unitPreference,
      timeZone: profile.data.timeZone ?? '',
    })
  }, [profile.data, form])

  if (profile.isError)
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-base font-semibold">Hồ sơ</h1>
        <p className="text-muted-foreground text-xs">
          Ngày sinh, chiều cao và mức hoạt động dùng để tính TDEE khởi điểm.
        </p>
      </div>
      {profile.isLoading ? (
        <div className="max-w-2xl space-y-4" aria-busy="true">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : (
        <ProfileForm
          form={form}
          isPending={updateProfile.isPending}
          error={updateProfile.error ? getFormErrorMessage(updateProfile.error) : null}
          onSubmit={(values) =>
            updateProfile.mutate({ ...values, timeZone: values.timeZone || null })
          }
        />
      )}
    </div>
  )
}
