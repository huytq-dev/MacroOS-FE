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
              {isEdit ? 'Edit food' : 'Create food'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter nutrition per 100 g. You can add one serving, for example 1 cup = 150 g.
            </DialogDescription>
          </DialogHeader>

          <FormErrorAlert title="Couldn't save food" message={error} />

          <FormField
            label="Name"
            required
            error={errors.name?.message}
            counter={{ current: form.watch('name')?.length ?? 0, max: 256 }}
          >
            {(field) => <Input {...field} maxLength={256} {...register('name')} />}
          </FormField>

          <FormField label="Brand" hint="Optional" error={errors.brand?.message}>
            {(field) => <Input {...field} maxLength={256} {...register('brand')} />}
          </FormField>

          <FormField label="Category" required error={errors.category?.message}>
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
                    placeholder="Choose a category"
                  />
                )}
              />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            {macro('caloriesPer100g', 'kcal /100 g')}
            {macro('proteinPer100g', 'Protein (g)')}
            {macro('carbsPer100g', 'Carbs (g)')}
            {macro('fatPer100g', 'Fat (g)')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Serving" hint="Example: 1 cup" error={errors.servingName?.message}>
              {(field) => <Input {...field} maxLength={100} {...register('servingName')} />}
            </FormField>
            <FormField label="Grams" error={errors.servingGrams?.message}>
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
