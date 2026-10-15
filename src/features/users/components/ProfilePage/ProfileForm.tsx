'use client'

import { Controller, type UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTIVITY_LEVEL, GENDER, UNIT_SYSTEM, enumOptions } from '@/config/enums'
import type { UpdateProfileFormValues } from '../../schemas/update-profile.schema'

interface ProfileFormProps {
  readonly form: UseFormReturn<UpdateProfileFormValues>
  readonly isPending: boolean
  readonly onSubmit: (values: UpdateProfileFormValues) => void
}

function FieldMessage({ message }: { readonly message?: string }) {
  return message ? <p className="text-destructive text-[11px]">{message}</p> : null
}

export function ProfileForm({ form, isPending, onSubmit }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form

  const selectField = (name: 'gender' | 'activityLevel' | 'unitPreference', label: string, labels: Record<string, string>) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="w-full">
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
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-2xl grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="lastName">Họ</Label>
        <Input id="lastName" {...register('lastName')} />
        <FieldMessage message={errors.lastName?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="firstName">Tên</Label>
        <Input id="firstName" {...register('firstName')} />
        <FieldMessage message={errors.firstName?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dateOfBirth">Ngày sinh</Label>
        <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
        <FieldMessage message={errors.dateOfBirth?.message} />
      </div>
      {selectField('gender', 'Giới tính', GENDER)}
      <div className="space-y-1.5">
        <Label htmlFor="heightCm">Chiều cao (cm)</Label>
        <Input id="heightCm" type="number" inputMode="decimal" step="0.1" {...register('heightCm', { valueAsNumber: true })} />
        <FieldMessage message={errors.heightCm?.message} />
      </div>
      {selectField('activityLevel', 'Mức hoạt động (ngoài tập)', ACTIVITY_LEVEL)}
      {selectField('unitPreference', 'Đơn vị hiển thị', UNIT_SYSTEM)}
      <div className="space-y-1.5">
        <Label htmlFor="timeZone">Múi giờ</Label>
        <Input id="timeZone" placeholder="Asia/Ho_Chi_Minh" {...register('timeZone')} />
      </div>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
          Lưu hồ sơ
        </Button>
      </div>
    </form>
  )
}
