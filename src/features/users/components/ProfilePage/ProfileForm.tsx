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
  { value: '', label: 'Không chọn' },
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
      <FormErrorAlert title="Không lưu được hồ sơ" message={error ?? firstError ?? null} />

      <ListSection label="Thông tin cá nhân">
        <ListRow
          label="Họ và tên"
          value={fullName || 'Chưa đặt'}
          attention={!fullName || Boolean(errors.firstName || errors.lastName)}
          onClick={() => setSheet('name')}
        />
        <ListRow
          label="Ngày sinh"
          hint="Dùng để tính TDEE khởi điểm"
          value={values.dateOfBirth ? formatDateVi(values.dateOfBirth) : 'Chưa đặt'}
          attention={!values.dateOfBirth || Boolean(errors.dateOfBirth)}
          onClick={() => setSheet('dob')}
        />
        <ListRow
          label="Giới tính"
          value={GENDER[values.gender]}
          onClick={() => setSheet('gender')}
        />
        <ListRow
          label="Chiều cao"
          value={Number.isFinite(values.heightCm) ? `${values.heightCm} cm` : 'Chưa đặt'}
          attention={Boolean(errors.heightCm)}
          onClick={() => setSheet('height')}
        />
      </ListSection>

      <ListSection label="Hoạt động" footer="Mức hoạt động hằng ngày, không tính buổi tập.">
        <ListRow
          label="Mức hoạt động"
          value={ACTIVITY_LEVEL[values.activityLevel].split(' (')[0]}
          onClick={() => setSheet('activity')}
        />
      </ListSection>

      <ListSection label="Hiển thị">
        <ListRow
          label="Đơn vị"
          value={UNIT_SYSTEM[values.unitPreference]}
          onClick={() => setSheet('unit')}
        />
        <ListRow
          label="Múi giờ"
          hint="Quyết định ngày hôm nay của nhật ký"
          value={
            TIME_ZONE_OPTIONS.find((zone) => zone.value === values.timeZone)?.label ?? 'Chưa chọn'
          }
          onClick={() => setSheet('timeZone')}
        />
      </ListSection>

      <ListSection label="Tài khoản">
        <ListRow label="Thực phẩm của tôi" href={routePath.foods} />
        <ListRow label="Đăng xuất" destructive onClick={onLogout} />
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
            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      )}

      <PickerSheet open={sheet === 'name'} onOpenChange={close} title="Họ và tên">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Họ" required error={errors.lastName?.message}>
            {(field) => <Input {...field} autoComplete="family-name" {...register('lastName')} />}
          </FormField>
          <FormField label="Tên" required error={errors.firstName?.message}>
            {(field) => <Input {...field} autoComplete="given-name" {...register('firstName')} />}
          </FormField>
        </div>
      </PickerSheet>

      <PickerSheet
        open={sheet === 'dob'}
        onOpenChange={close}
        title="Ngày sinh"
        description="Dùng để tính TDEE khởi điểm."
      >
        <FormField label="Ngày sinh" required error={errors.dateOfBirth?.message}>
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

      <PickerSheet open={sheet === 'gender'} onOpenChange={close} title="Giới tính">
        <OptionList
          aria-label="Giới tính"
          options={GENDER_OPTIONS}
          value={values.gender}
          onValueChange={(value) => pick('gender', value)}
        />
      </PickerSheet>

      <PickerSheet open={sheet === 'height'} onOpenChange={close} title="Chiều cao">
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
      </PickerSheet>

      <PickerSheet
        open={sheet === 'activity'}
        onOpenChange={close}
        title="Mức hoạt động"
        description="Không tính buổi tập."
      >
        <OptionList
          aria-label="Mức hoạt động"
          options={ACTIVITY_OPTIONS}
          value={values.activityLevel}
          onValueChange={(value) => pick('activityLevel', value)}
        />
      </PickerSheet>

      <PickerSheet open={sheet === 'unit'} onOpenChange={close} title="Đơn vị">
        <OptionList
          aria-label="Đơn vị"
          options={UNIT_OPTIONS}
          value={values.unitPreference}
          onValueChange={(value) => pick('unitPreference', value)}
        />
      </PickerSheet>

      <PickerSheet
        open={sheet === 'timeZone'}
        onOpenChange={close}
        title="Múi giờ"
        description="Quyết định ngày hôm nay của nhật ký."
      >
        <div className="max-h-[45dvh] overflow-y-auto overscroll-contain">
          <OptionList
            aria-label="Múi giờ"
            options={TIME_ZONE_PICKER}
            value={values.timeZone ?? ''}
            onValueChange={(value) => pick('timeZone', value)}
          />
        </div>
      </PickerSheet>
    </form>
  )
}
