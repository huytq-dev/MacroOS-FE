'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProfile, useUpdateProfile } from '../hooks/use-profile'
import { updateProfileSchema, type UpdateProfileFormValues } from '../schemas/update-profile.schema'
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

  // Đổ dữ liệu BE vào form sau khi tải; reset cũng đặt lại trạng thái "chưa có thay đổi"
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
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="Hồ sơ" eyebrow={user?.email} />
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
          onSubmit={(values) =>
            updateProfile.mutate({ ...values, timeZone: values.timeZone || null })
          }
          onLogout={() => void logout()}
        />
      )}
    </div>
  )
}
