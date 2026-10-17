'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DateField } from '@/components/shared/DateField'
import { FormField } from '@/components/shared/FormField'
import { ListRow, ListSection } from '@/components/shared/ListGroup'
import { OptionList, PickerSheet } from '@/components/shared/PickerSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ACTIVITY_LEVEL, GENDER, UNIT_SYSTEM, enumOptions } from '@/config/enums'
import { routePath } from '@/config/route-path'
import { TIME_ZONE_OPTIONS } from '@/config/time-zones'
import { formatDateVi } from '@/lib/date'
import type { UpdateProfileFormValues } from '../../schemas/update-profile.schema'

interface ProfileFormProps {
  readonly form: UseFormReturn<UpdateProfileFormValues>
  readonly isPending: boolean
  readonly error: string | null
  readonly onSubmit: (values: UpdateProfileFormValues) => void
  readonly onLogout: () => void
}

type SheetKey = 'name' | 'dob' | 'gender' | 'height' | 'activity' | 'unit' | 'timeZone' | null

const GENDER_OPTIONS = enumOptions(GENDER)
const ACTIVITY_OPTIONS = enumOptions(ACTIVITY_LEVEL).map((option) => {
  const [label, detail] = option.label.split(' (')
  return { value: option.value, label, description: detail?.replace(')', '') }
})
const UNIT_OPTIONS = enumOptions(UNIT_SYSTEM)
const TIME_ZONE_PICKER = [
  { value: '', label: 'None' },
  ...TIME_ZONE_OPTIONS.map((zone) => ({
    value: zone.value,
    label: zone.label,
    description: zone.description,
  })),
]

/**
 * Hồ sơ dạng danh sách (như màn cài đặt của iOS): mỗi dòng một giá trị, chạm để sửa trong bảng trượt lên.
 * Nút Lưu thay đổi dính đáy và chỉ hiện khi có thay đổi (UI.md mục 12, 17, 24).
 */
export function ProfileForm({ form, isPending, error, onSubmit, onLogout }: ProfileFormProps) {
  const [sheet, setSheet] = useState<SheetKey>(null)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form

  const values = watch()
  const close = (next: boolean) => !next && setSheet(null)
  const pick = (name: 'gender' | 'activityLevel' | 'unitPreference' | 'timeZone', value: string) =>
    setValue(name, value as never, { shouldDirty: true, shouldValidate: true })

  const fullName = `${values.lastName} ${values.firstName}`.trim()
  const firstError = Object.values(errors)[0]?.message
  const submit = (formValues: UpdateProfileFormValues) => {
    if (isPending) return
    onSubmit(formValues)
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <FormErrorAlert title="Couldn't save profile" message={error ?? firstError ?? null} />

      <ListSection label="Personal info">
        <ListRow
          label="Name"
          value={fullName || 'Not set'}
          attention={!fullName || Boolean(errors.firstName || errors.lastName)}
          onClick={() => setSheet('name')}
        />
        <ListRow
          label="Date of birth"
          hint="Used to estimate your starting TDEE"
          value={values.dateOfBirth ? formatDateVi(values.dateOfBirth) : 'Not set'}
          attention={!values.dateOfBirth || Boolean(errors.dateOfBirth)}
          onClick={() => setSheet('dob')}
        />
        <ListRow label="Gender" value={GENDER[values.gender]} onClick={() => setSheet('gender')} />
        <ListRow
          label="Height"
          value={Number.isFinite(values.heightCm) ? `${values.heightCm} cm` : 'Not set'}
          attention={Boolean(errors.heightCm)}
          onClick={() => setSheet('height')}
        />
      </ListSection>

      <ListSection label="Activity" footer="Your daily activity level, not counting workouts.">
        <ListRow
          label="Activity level"
          value={ACTIVITY_LEVEL[values.activityLevel].split(' (')[0]}
          onClick={() => setSheet('activity')}
        />
      </ListSection>

      <ListSection label="Display">
        <ListRow
          label="Units"
          value={UNIT_SYSTEM[values.unitPreference]}
          onClick={() => setSheet('unit')}
        />
        <ListRow
          label="Time zone"
          hint="Determines what counts as today in your log"
          value={
            TIME_ZONE_OPTIONS.find((zone) => zone.value === values.timeZone)?.label ??
            'Not selected'
          }
          onClick={() => setSheet('timeZone')}
        />
      </ListSection>

      <ListSection label="Account">
        <ListRow label="My foods" href={routePath.foods} />
        <ListRow label="Sign out" destructive onClick={onLogout} />
      </ListSection>

      {/* Dính đáy, nằm trên thanh tab; chỉ hiện khi có thay đổi chưa lưu */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3 md:static md:p-0">
          <Button
            type="submit"
            className="h-12 w-full text-base shadow-[0_4px_16px_rgb(0_0_0/0.16)] md:h-10 md:w-auto md:text-sm md:shadow-none"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      )}

      <PickerSheet open={sheet === 'name'} onOpenChange={close} title="Name">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" required error={errors.firstName?.message}>
            {(field) => <Input {...field} autoComplete="given-name" {...register('firstName')} />}
          </FormField>
          <FormField label="Last name" required error={errors.lastName?.message}>
            {(field) => <Input {...field} autoComplete="family-name" {...register('lastName')} />}
          </FormField>
        </div>
      </PickerSheet>

      <PickerSheet
        open={sheet === 'dob'}
        onOpenChange={close}
        title="Date of birth"
        description="Used to estimate your starting TDEE."
      >
        <FormField label="Date of birth" required error={errors.dateOfBirth?.message}>
          {(field) => (
            <DateField
              {...field}
              autoComplete="bday"
              value={values.dateOfBirth}
              onValueChange={(next) =>
                setValue('dateOfBirth', next, { shouldDirty: true, shouldValidate: true })
              }
            />
          )}
        </FormField>
      </PickerSheet>

      <PickerSheet open={sheet === 'gender'} onOpenChange={close} title="Gender">
        <OptionList
          aria-label="Gender"
          options={GENDER_OPTIONS}
          value={values.gender}
          onValueChange={(value) => pick('gender', value)}
        />
      </PickerSheet>

      <PickerSheet open={sheet === 'height'} onOpenChange={close} title="Height">
        <FormField label="Height (cm)" required error={errors.heightCm?.message}>
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
      </PickerSheet>

      <PickerSheet
        open={sheet === 'activity'}
        onOpenChange={close}
        title="Activity level"
        description="Not counting workouts."
      >
        <OptionList
          aria-label="Activity level"
          options={ACTIVITY_OPTIONS}
          value={values.activityLevel}
          onValueChange={(value) => pick('activityLevel', value)}
        />
      </PickerSheet>

      <PickerSheet open={sheet === 'unit'} onOpenChange={close} title="Units">
        <OptionList
          aria-label="Units"
          options={UNIT_OPTIONS}
          value={values.unitPreference}
          onValueChange={(value) => pick('unitPreference', value)}
        />
      </PickerSheet>

      <PickerSheet
        open={sheet === 'timeZone'}
        onOpenChange={close}
        title="Time zone"
        description="Determines what counts as today in your log."
      >
        <div className="max-h-[45dvh] overflow-y-auto overscroll-contain">
          <OptionList
            aria-label="Time zone"
            options={TIME_ZONE_PICKER}
            value={values.timeZone ?? ''}
            onValueChange={(value) => pick('timeZone', value)}
          />
        </div>
      </PickerSheet>
    </form>
  )
}
