'use client'

import { Controller, type UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { SearchableSelect } from '@/components/shared/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ACTIVITY_LEVEL, GENDER, UNIT_SYSTEM, enumOptions } from '@/config/enums'
import { TIME_ZONE_OPTIONS } from '@/config/time-zones'
import type { UpdateProfileFormValues } from '../../schemas/update-profile.schema'

interface ProfileFormProps {
  readonly form: UseFormReturn<UpdateProfileFormValues>
  readonly isPending: boolean
  readonly error: string | null
  readonly onSubmit: (values: UpdateProfileFormValues) => void
}

type EnumField = 'gender' | 'activityLevel' | 'unitPreference'

export function ProfileForm({ form, isPending, error, onSubmit }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form

  // Tập giá trị cố định ≤ 7 mục → `Select` (UI.md mục 1)
  const enumSelect = (
    name: EnumField,
    label: string,
    labels: Record<string, string>,
    hint?: string
  ) => (
    <FormField label={label} hint={hint} required error={errors[name]?.message}>
      {(field) => (
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange } }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger
                id={field.id}
                aria-invalid={field['aria-invalid']}
                aria-describedby={field['aria-describedby']}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" sideOffset={4} position="popper">
                {enumOptions(labels).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </FormField>
  )

  const submit = (values: UpdateProfileFormValues) => {
    if (isPending) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="max-w-2xl space-y-4">
      <FormErrorAlert title="Không lưu được hồ sơ" message={error} />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <FormField label="Họ" required error={errors.lastName?.message}>
            {(field) => <Input {...field} autoComplete="family-name" {...register('lastName')} />}
          </FormField>
          <FormField label="Tên" required error={errors.firstName?.message}>
            {(field) => <Input {...field} autoComplete="given-name" {...register('firstName')} />}
          </FormField>
          <FormField
            label="Ngày sinh"
            hint="Dùng để tính TDEE khởi điểm"
            required
            error={errors.dateOfBirth?.message}
          >
            {(field) => (
              <Input {...field} type="date" autoComplete="bday" {...register('dateOfBirth')} />
            )}
          </FormField>
          {enumSelect('gender', 'Giới tính', GENDER)}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Cơ thể và hoạt động</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <FormField label="Chiều cao (cm)" required error={errors.heightCm?.message}>
            {(field) => (
              <Input
                {...field}
                type="number"
                inputMode="decimal"
                step="0.1"
                {...register('heightCm', { valueAsNumber: true })}
              />
            )}
          </FormField>
          {enumSelect('activityLevel', 'Mức hoạt động', ACTIVITY_LEVEL, 'Không tính buổi tập')}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          {enumSelect('unitPreference', 'Đơn vị', UNIT_SYSTEM)}
          <FormField
            label="Múi giờ"
            hint="Quyết định ngày hôm nay của nhật ký"
            error={errors.timeZone?.message}
          >
            {(field) => (
              <Controller
                control={control}
                name="timeZone"
                render={({ field: { value, onChange } }) => (
                  <SearchableSelect
                    {...field}
                    options={TIME_ZONE_OPTIONS}
                    value={value ?? ''}
                    onValueChange={onChange}
                    placeholder="Chọn múi giờ"
                    clearLabel="Không chọn"
                  />
                )}
              />
            )}
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </Button>
      </div>
    </form>
  )
}
