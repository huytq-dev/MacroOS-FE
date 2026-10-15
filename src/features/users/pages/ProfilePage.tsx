'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProfile, useUpdateProfile } from '../hooks/use-profile'
import { updateProfileSchema, type UpdateProfileFormValues } from '../schemas/update-profile.schema'
import { ProfileForm } from '../components/ProfilePage'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfilePage() {
  const profile = useProfile()
  const updateProfile = useUpdateProfile()

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
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

  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-base font-semibold">Hồ sơ</h1>
        <p className="text-muted-foreground text-xs">Ngày sinh, chiều cao, mức hoạt động dùng để tính TDEE khởi điểm.</p>
      </div>
      {profile.isLoading ? (
        <div className="grid max-w-2xl grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-md" />
          ))}
        </div>
      ) : (
        <ProfileForm
          form={form}
          isPending={updateProfile.isPending}
          onSubmit={(values) => updateProfile.mutate({ ...values, timeZone: values.timeZone || null })}
        />
      )}
    </div>
  )
}
