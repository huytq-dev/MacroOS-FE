'use client'

import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MEAL_TYPE, enumOptions, type MealType } from '@/config/enums'
import { cn } from '@/lib/utils'
import type { PlateItem } from '../../types/food-log.types'

export type AddTab = 'search' | 'quick'

interface AddFoodDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly tab: AddTab
  readonly onTabChange: (tab: AddTab) => void
  readonly meal: MealType
  readonly onMealChange: (meal: MealType) => void
  readonly plate: PlateItem[]
  readonly isLogging: boolean
  readonly onRemoveFromPlate: (key: string) => void
  readonly onLogPlate: () => void
  readonly children: React.ReactNode
}

const TABS: { value: AddTab; label: string }[] = [
  { value: 'search', label: 'Tìm món' },
  { value: 'quick', label: 'Nhập nhanh' },
]

/** Sheet thêm món: chọn bữa, 2 tab (tìm / nhập nhanh), "plate" gom nhiều món rồi log một lượt ở thanh đáy. */
export function AddFoodDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
  meal,
  onMealChange,
  plate,
  isLogging,
  onRemoveFromPlate,
  onLogPlate,
  children,
}: AddFoodDialogProps) {
  const plateKcal = plate.reduce((sum, item) => sum + item.calories, 0)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] flex-col gap-0 p-0 sm:h-[80dvh] sm:max-w-lg sm:p-0">
        <DialogHeader className="space-y-3 border-b p-4 pr-12">
          <DialogTitle>Thêm món</DialogTitle>
          <DialogDescription className="sr-only">Tìm thực phẩm hoặc nhập nhanh kcal và macro</DialogDescription>
          <NativeSelect aria-label="Bữa" value={meal} onChange={(event) => onMealChange(event.target.value as MealType)}>
            {enumOptions(MEAL_TYPE).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <div className="flex gap-1">
            {TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={tab === item.value}
                onClick={() => onTabChange(item.value)}
                className={cn(
                  'h-9 flex-1 rounded-full text-sm font-medium transition-colors',
                  tab === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-muted'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {plate.length > 0 && (
          <div className="bg-background space-y-2 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <ul className="max-h-28 space-y-1 overflow-y-auto text-sm">
              {plate.map((item) => (
                <li key={item.key} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">
                    {item.name} <span className="text-muted-foreground text-xs">· {item.servingLabel}</span>
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">{item.calories} kcal</span>
                  <Button variant="ghost" size="icon" className="size-8" aria-label={`Bỏ ${item.name}`} onClick={() => onRemoveFromPlate(item.key)}>
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <Button className="w-full" size="lg" disabled={isLogging} onClick={onLogPlate}>
              {isLogging && <Loader2 size={16} className="mr-2 animate-spin" />}
              Log {plate.length} món · {Math.round(plateKcal)} kcal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
