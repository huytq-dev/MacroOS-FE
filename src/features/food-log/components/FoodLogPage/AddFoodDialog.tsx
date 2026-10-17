'use client'

import { Loader2, Search, Utensils, X, Zap } from 'lucide-react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MEAL_TYPE, type MealType } from '@/config/enums'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { MacroTotals, PlateItem } from '../../types/food-log.types'
import { SearchInput } from '@/components/shared/SearchInput'
import { useKeyboardInset } from '@/hooks/use-keyboard-inset'
import type { FoodLogSettings } from '../../food-log-settings'
import { AddFoodProgress } from './AddFoodProgress'
import { MealTimePill } from './MealTimePill'

export type AddTab = 'search' | 'quick'

interface AddFoodDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly tab: AddTab
  readonly onTabChange: (tab: AddTab) => void
  readonly meal: MealType
  readonly eatenAt: string
  readonly onEatenAtChange: (time: string) => void
  readonly search: string
  readonly onSearchChange: (value: string) => void
  readonly plate: PlateItem[]
  readonly totals?: MacroTotals
  readonly target?: ProgramWeek | null
  /** Cài đặt Logger Banner (chất hiện trên banner và cách tính). */
  readonly settings: Pick<
    FoodLogSettings,
    | 'loggerBannerShowCalories'
    | 'loggerBannerShowProtein'
    | 'loggerBannerShowFat'
    | 'loggerBannerShowCarbs'
    | 'loggerBannerDisplay'
  >
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
  eatenAt,
  onEatenAtChange,
  search,
  onSearchChange,
  plate,
  totals,
  target,
  settings,
  isLogging,
  error,
  onRemoveFromPlate,
  onLogPlate,
  children,
}: AddFoodDialogProps) {
  const keyboardInset = useKeyboardInset(open)
  const plateKcal = plate.reduce((sum, item) => sum + item.calories, 0)
  const plateTotals: MacroTotals = {
    calories: plateKcal,
    protein: plate.reduce((sum, item) => sum + item.protein, 0),
    carbs: plate.reduce((sum, item) => sum + item.carbs, 0),
    fat: plate.reduce((sum, item) => sum + item.fat, 0),
    fiber: 0,
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !isLogging && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[92dvh] flex-col gap-0 p-0 sm:h-[80dvh] sm:max-w-lg sm:p-0"
        style={keyboardInset > 0 ? { bottom: keyboardInset } : undefined}
      >
        <DialogHeader className="relative z-20 space-y-0">
          <DialogTitle className="sr-only">Add food</DialogTitle>
          <DialogDescription className="sr-only">
            Search for a food or quick add calories and macros
          </DialogDescription>
          <div className="flex items-center gap-2 px-3 py-3">
            <button
              type="button"
              aria-label="Close"
              disabled={isLogging}
              onClick={() => onOpenChange(false)}
              className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <MealTimePill
              time={eatenAt}
              mealLabel={MEAL_TYPE[meal]}
              onTimeChange={onEatenAtChange}
            />
            <AddFoodProgress
              totals={totals}
              target={target}
              plate={plateTotals}
              show={{
                calories: settings.loggerBannerShowCalories,
                protein: settings.loggerBannerShowProtein,
                fat: settings.loggerBannerShowFat,
                carbs: settings.loggerBannerShowCarbs,
              }}
              display={settings.loggerBannerDisplay}
            />
            <span
              role="status"
              aria-label={`${plate.length} ${plate.length === 1 ? 'item' : 'items'} in plate`}
              className="bg-secondary flex h-11 shrink-0 items-center gap-1 rounded-full px-3 text-base font-semibold tabular-nums"
            >
              <Utensils aria-hidden="true" className="size-5" />
              {plate.length > 0 && `+${plate.length}`}
            </span>
          </div>
          <Tabs value={tab} onValueChange={(next) => onTabChange(next as AddTab)}>
            <TabsList variant="line" className="w-full border-b">
              <TabsTrigger
                value="search"
                className="h-11 flex-1 text-base group-data-horizontal/tabs:after:bottom-0 md:text-sm"
              >
                <Search aria-hidden="true" /> Search
              </TabsTrigger>
              <TabsTrigger
                value="quick"
                className="h-11 flex-1 text-base group-data-horizontal/tabs:after:bottom-0 md:text-sm"
              >
                <Zap aria-hidden="true" /> Quick add
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        {error && (
          <div className="px-4 pb-2">
            <FormErrorAlert title="Couldn't add food" message={error} />
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>

        <div className="bg-card space-y-2 rounded-t-2xl px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--border)]">
          {plate.length > 0 && (
            <ul className="max-h-24 space-y-1 overflow-y-auto text-sm">
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
                    label={`Remove ${item.name}`}
                    disabled={isLogging}
                    onClick={() => onRemoveFromPlate(item.key)}
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3">
            {tab === 'search' && (
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={search}
                  onValueChange={onSearchChange}
                  placeholder="Search for a food"
                  aria-label="Search for a food"
                />
              </div>
            )}
            {plate.length > 0 && (
              <Button
                className={
                  tab === 'search'
                    ? 'h-12 shrink-0 rounded-full px-5 text-base'
                    : 'h-12 w-full rounded-full text-base'
                }
                disabled={isLogging}
                aria-busy={isLogging}
                onClick={() => {
                  if (!isLogging) onLogPlate()
                }}
              >
                {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                {isLogging
                  ? 'Logging...'
                  : `Log ${plate.length} ${plate.length === 1 ? 'item' : 'items'}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
