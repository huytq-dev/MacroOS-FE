'use client'

import { Controller, type UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FOOD_CATEGORY, enumOptions } from '@/config/enums'
import type { CustomFoodFormValues } from '../../schemas/custom-food.schema'

interface CustomFoodDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly isEdit: boolean
  readonly form: UseFormReturn<CustomFoodFormValues>
  readonly isPending: boolean
  readonly onSubmit: (values: CustomFoodFormValues) => void
}

const optionalNumber = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : Number(value))

export function CustomFoodDialog({ open, onOpenChange, isEdit, form, isPending, onSubmit }: CustomFoodDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form
  const message = (text?: string) => (text ? <p className="text-destructive text-[11px]">{text}</p> : null)
  const number = (name: 'caloriesPer100g' | 'proteinPer100g' | 'carbsPer100g' | 'fatPer100g', label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type="number" inputMode="decimal" step="0.1" {...register(name, { valueAsNumber: true })} />
      {message(errors[name]?.message)}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Sửa thực phẩm' : 'Tạo thực phẩm'}</DialogTitle>
            <DialogDescription>Nhập dinh dưỡng trên 100 g. Có thể thêm một khẩu phần (vd: 1 chén = 150 g).</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên</Label>
            <Input id="name" {...register('name')} />
            {message(errors.name?.message)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand">Thương hiệu (tuỳ chọn)</Label>
            <Input id="brand" {...register('brand')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Nhóm</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4} position="popper">
                    {enumOptions(FOOD_CATEGORY).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {number('caloriesPer100g', 'kcal /100 g')}
            {number('proteinPer100g', 'Protein (g)')}
            {number('carbsPer100g', 'Carb (g)')}
            {number('fatPer100g', 'Fat (g)')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="servingName">Khẩu phần</Label>
              <Input id="servingName" placeholder="1 chén" {...register('servingName')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="servingGrams">Số gram</Label>
              <Input id="servingGrams" type="number" inputMode="decimal" step="0.1" {...register('servingGrams', { setValueAs: optionalNumber })} />
              {message(errors.servingGrams?.message)}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
