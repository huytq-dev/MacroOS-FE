'use client'

import { Controller, type UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { SearchableSelect } from '@/components/shared/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FOOD_CATEGORY, enumOptions } from '@/config/enums'
import type { CustomFoodFormValues } from '../../schemas/custom-food.schema'

interface CustomFoodDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly isEdit: boolean
  readonly form: UseFormReturn<CustomFoodFormValues>
  readonly isPending: boolean
  readonly error: string | null
  readonly onSubmit: (values: CustomFoodFormValues) => void
}

const optionalNumber = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : Number(value)
const categoryOptions = enumOptions(FOOD_CATEGORY)

type MacroName = 'caloriesPer100g' | 'proteinPer100g' | 'carbsPer100g' | 'fatPer100g'

export function CustomFoodDialog({
  open,
  onOpenChange,
  isEdit,
  form,
  isPending,
  error,
  onSubmit,
}: CustomFoodDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form

  const macro = (name: MacroName, label: string) => (
    <FormField label={label} required error={errors[name]?.message}>
      {(field) => (
        <Input
          {...field}
          type="number"
          inputMode="decimal"
          step="0.1"
          {...register(name, { valueAsNumber: true })}
        />
      )}
    </FormField>
  )

  const submit = (values: CustomFoodFormValues) => {
    if (isPending) return
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-sans text-sm font-semibold">
              {isEdit ? 'Sửa thực phẩm' : 'Tạo thực phẩm'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nhập dinh dưỡng trên 100 g. Có thể thêm một khẩu phần, ví dụ 1 chén = 150 g.
            </DialogDescription>
          </DialogHeader>

          <FormErrorAlert title="Không lưu được thực phẩm" message={error} />

          <FormField
            label="Tên"
            required
            error={errors.name?.message}
            counter={{ current: form.watch('name')?.length ?? 0, max: 256 }}
          >
            {(field) => <Input {...field} maxLength={256} {...register('name')} />}
          </FormField>

          <FormField label="Thương hiệu" hint="Không bắt buộc" error={errors.brand?.message}>
            {(field) => <Input {...field} maxLength={256} {...register('brand')} />}
          </FormField>

          <FormField label="Nhóm" required error={errors.category?.message}>
            {(field) => (
              <Controller
                control={control}
                name="category"
                render={({ field: { value, onChange } }) => (
                  <SearchableSelect
                    {...field}
                    options={categoryOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Chọn nhóm"
                  />
                )}
              />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            {macro('caloriesPer100g', 'kcal /100 g')}
            {macro('proteinPer100g', 'Protein (g)')}
            {macro('carbsPer100g', 'Carb (g)')}
            {macro('fatPer100g', 'Fat (g)')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Khẩu phần" hint="Ví dụ: 1 chén" error={errors.servingName?.message}>
              {(field) => <Input {...field} maxLength={100} {...register('servingName')} />}
            </FormField>
            <FormField label="Số gram" error={errors.servingGrams?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  {...register('servingGrams', { setValueAs: optionalNumber })}
                />
              )}
            </FormField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
