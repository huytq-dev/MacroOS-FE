'use client'

import { Loader2, X } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { IconButton } from '@/components/shared/IconButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MEAL_TYPE, enumOptions, type MealType } from '@/config/enums'
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
  readonly error: string | null
  readonly onRemoveFromPlate: (key: string) => void
  readonly onLogPlate: () => void
  readonly children: React.ReactNode
}

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
  error,
  onRemoveFromPlate,
  onLogPlate,
  children,
}: AddFoodDialogProps) {
  const plateKcal = plate.reduce((sum, item) => sum + item.calories, 0)
  return (
    <Dialog open={open} onOpenChange={(next) => !isLogging && onOpenChange(next)}>
      <DialogContent className="flex h-[92dvh] flex-col gap-0 p-0 sm:h-[80dvh] sm:max-w-lg sm:p-0">
        <DialogHeader className="space-y-3 p-4 pr-12">
          <DialogTitle className="font-sans text-base font-semibold">Thêm món</DialogTitle>
          <DialogDescription className="sr-only">
            Tìm thực phẩm hoặc nhập nhanh kcal và macro
          </DialogDescription>
          <Select value={meal} onValueChange={(next) => onMealChange(next as MealType)}>
            <SelectTrigger aria-label="Bữa" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" position="popper" sideOffset={4}>
              {enumOptions(MEAL_TYPE).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={tab} onValueChange={(next) => onTabChange(next as AddTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="search">Tìm món</TabsTrigger>
              <TabsTrigger value="quick">Nhập nhanh</TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        {error && (
          <div className="px-4 pb-2">
            <FormErrorAlert title="Không thêm được món" message={error} />
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>

        {plate.length > 0 && (
          <div className="bg-card space-y-2 rounded-t-2xl p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--border)]">
            <ul className="max-h-28 space-y-1 overflow-y-auto text-sm">
              {plate.map((item) => (
                <li key={item.key} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">
                    {item.name}{' '}
                    <span className="text-muted-foreground text-xs">· {item.servingLabel}</span>
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {item.calories} kcal
                  </span>
                  <IconButton
                    icon={X}
                    label={`Bỏ ${item.name}`}
                    disabled={isLogging}
                    onClick={() => onRemoveFromPlate(item.key)}
                  />
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              size="lg"
              disabled={isLogging}
              aria-busy={isLogging}
              onClick={() => {
                if (!isLogging) onLogPlate()
              }}
            >
              {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isLogging
                ? 'Đang log...'
                : `Log ${plate.length} món · ${Math.round(plateKcal)} kcal`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
