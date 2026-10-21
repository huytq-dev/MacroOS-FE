'use client'

import { useRef, useState } from 'react'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MEAL_DEFAULT_TIME, mealForTime } from '@/config/enums'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'
import type { FoodDetail } from '@/features/foods/types/food.types'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { useSheet } from '@/hooks/use-sheet'
import type { FoodLogSettings } from '../../food-log-settings'
import type { NutrientGoal } from '@/features/nutrition/goal-progress'
import type { FoodLogEntry, MacroTotals, UpdateEntryRequest } from '../../types/food-log.types'
import { AddFoodProgress } from './AddFoodProgress'
import { DateTimeSheet } from './DateTimeSheet'
import { FoodDetailView, type FoodDetailEdit } from './FoodDetail'

interface EntryEditDialogProps {
  /** Món đang sửa; giữ nguyên sau khi đóng để nội dung không biến mất trong lúc bảng trượt xuống. */
  readonly entry: FoodLogEntry | null
  readonly open: boolean
  readonly food?: FoodDetail
  readonly isFoodLoading: boolean
  readonly isPending: boolean
  readonly error: string | null
  /** Tổng ngày + mục tiêu cho thanh tiến độ trên cùng, và cờ chất nào hiện (Logger Banner). */
  readonly totals?: MacroTotals
  readonly target?: ProgramWeek | null
  readonly banner: Pick<
    FoodLogSettings,
    | 'loggerBannerShowCalories'
    | 'loggerBannerShowProtein'
    | 'loggerBannerShowFat'
    | 'loggerBannerShowCarbs'
  >
  /** Hôm nay (yyyy-MM-dd) cho bảng chọn giờ. */
  readonly today: string
  /** Mục tiêu từng chất (từ `GET /foods/{id}/nutrients`) cho vòng Impact và các thẻ chất. */
  readonly goals: Readonly<Record<string, NutrientGoal>>
  readonly isTargetsLoading: boolean
  readonly favorites: readonly FavoriteFood[]
  readonly isFavoritePending: boolean
  readonly onAddFavorite: (foodItemId: string, servingId: string | null, quantity: number) => void
  readonly onRemoveFavorite: (id: string) => void
  readonly onCopyToCustom: (food: FoodDetail) => void
  readonly onOpenChange: (open: boolean) => void
  readonly onSave: (id: string, payload: UpdateEntryRequest) => void
  /** Xoá luôn không hỏi lại; cha đóng màn sửa và gọi BE. */
  readonly onRequestDelete: (entry: FoodLogEntry) => void
}

type EditBodyProps = Omit<EntryEditDialogProps, 'entry' | 'open'> & {
  readonly entry: FoodLogEntry
}

interface Change {
  servingId: string | null
  quantity: number
  valid: boolean
}

const entryTime = (entry: FoodLogEntry) =>
  (entry.eatenAt ?? MEAL_DEFAULT_TIME[entry.mealType]).slice(0, 5)

/** Id khẩu phần ảo của món không thuộc thư viện (Quick Add, ước lượng AI, recipe): một "serving" = một đơn vị `quantity` của dòng log. */
const LOGGED_UNIT = 'logged-unit'

/**
 * Món ảo cho dòng log không có `foodItemId` để vẫn hiện đúng màn sửa như MacroFactor (macro, Impact, bảng chất toàn 0, "1 serving").
 * Macro của một đơn vị = tổng của dòng chia số lượng; khẩu phần ảo nặng 100 g nên "lượng × 100 g" khớp công thức của Food Detail.
 */
function loggedFood(entry: FoodLogEntry): FoodDetail {
  const units = entry.quantity > 0 ? entry.quantity : 1
  return {
    id: entry.id,
    name: entry.foodName,
    brand: null,
    barcode: null,
    category: 'Other',
    source: 'Logged',
    isVerified: false,
    isMine: true,
    imageUrl: null,
    emoji: entry.emoji,
    iconKey: entry.iconKey,
    nutrition: {
      caloriesPer100g: entry.calories / units,
      proteinPer100g: entry.protein / units,
      carbsPer100g: entry.carbs / units,
      fatPer100g: entry.fat / units,
    },
    servings: [{ id: LOGGED_UNIT, servingName: 'serving', weightInGrams: 100, isDefault: true }],
  }
}

/**
 * Nội dung màn sửa món đã log (mount lại theo entry.id): thanh tiến độ ngày một hàng, hàng icon + giờ + Done, rồi tấm sheet là
 * Food Detail (X, macro, Remove / Favorite / To Custom, Impact on Targets, các nhóm chất, thanh đáy lượng + Done). Cả hai nút Done
 * lưu cùng một thay đổi: khẩu phần + số lượng lấy từ Food Detail qua `onChange`, giờ từ bảng chọn giờ.
 */
function EditBody({
  entry,
  food,
  isFoodLoading,
  isPending,
  error,
  totals,
  target,
  banner,
  today,
  goals,
  isTargetsLoading,
  favorites,
  isFavoritePending,
  onAddFavorite,
  onRemoveFavorite,
  onCopyToCustom,
  onOpenChange,
  onSave,
  onRequestDelete,
}: EditBodyProps) {
  const [time, setTime] = useState(entryTime(entry))
  const timeSheet = useSheet<true>()
  // Dòng không có món trong thư viện (Quick Add / AI / recipe) dùng món ảo; lưu thì khẩu phần ảo quy về khẩu phần gốc của dòng (null)
  const inLibrary = entry.foodItemId !== null
  const detail = food ?? (inLibrary ? undefined : loggedFood(entry))
  const initialServingId = inLibrary ? entry.foodServingId : LOGGED_UNIT
  const change = useRef<Change>({
    servingId: initialServingId,
    quantity: entry.quantity,
    valid: true,
  })

  const save = ({ servingId, quantity }: Pick<Change, 'servingId' | 'quantity'>) =>
    onSave(entry.id, {
      // Đổi giờ thì bữa suy lại từ giờ mới; không đổi thì giữ bữa cũ
      mealType: time === entryTime(entry) ? entry.mealType : mealForTime(time),
      eatenAt: `${time}:00`,
      foodServingId: servingId === LOGGED_UNIT ? entry.foodServingId : servingId,
      quantity,
    })

  const edit: FoodDetailEdit = {
    initialServingId,
    initialQuantity: entry.quantity,
    onRemove: () => onRequestDelete(entry),
    onDone: save,
    onChange: (next) => {
      change.current = next
    },
    isSaving: isPending,
    // Món ảo không rõ khối lượng: chỉ chip "serving", không có g / oz
    weightUnits: inLibrary,
  }

  return (
    <>
      <DialogHeader className="space-y-0">
        <DialogTitle className="sr-only">{entry.foodName}</DialogTitle>
        <DialogDescription className="sr-only">Edit this logged food</DialogDescription>
        <div className="space-y-3 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
          <AddFoodProgress
            layout="row"
            totals={totals}
            target={target}
            plate={{ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }}
            show={{
              calories: banner.loggerBannerShowCalories,
              protein: banner.loggerBannerShowProtein,
              fat: banner.loggerBannerShowFat,
              carbs: banner.loggerBannerShowCarbs,
            }}
            display="AllDayAndPlate"
          />
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="border-border flex size-11 shrink-0 items-center justify-center rounded-full border"
            >
              <FoodIcon iconKey={entry.iconKey} emoji={entry.emoji} size={28} />
            </span>
            <span className="flex-1" />
            <button
              type="button"
              aria-label={`Logged at ${time}, change time`}
              onClick={() => timeSheet.show(true)}
              className="bg-secondary focus-visible:ring-ring/50 active:bg-muted flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-base font-medium tabular-nums transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
            >
              {time}
            </button>
            <Button
              className="bg-foreground text-background h-11 rounded-full px-6 text-base"
              disabled={isPending || !detail}
              aria-busy={isPending}
              onClick={() => {
                if (change.current.valid) save(change.current)
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div className="bg-card flex min-h-0 flex-1 flex-col rounded-t-3xl">
        {error && (
          <div className="px-4 pt-3">
            <FormErrorAlert title="Couldn't save food" message={error} />
          </div>
        )}
        {!detail || (inLibrary && isFoodLoading) ? (
          <div className="space-y-3 p-4" aria-busy="true">
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : (
          <FoodDetailView
            food={detail}
            onBack={() => onOpenChange(false)}
            onAdd={() => undefined}
            favorites={inLibrary ? favorites : []}
            isFavoritePending={isFavoritePending || !inLibrary}
            onAddFavorite={(servingId, quantity) => onAddFavorite(detail.id, servingId, quantity)}
            onRemoveFavorite={onRemoveFavorite}
            goals={goals}
            isTargetsLoading={isTargetsLoading}
            isLogging={false}
            onLogFoods={() => undefined}
            onCopyToCustom={onCopyToCustom}
            isCopyPending={false}
            edit={edit}
          />
        )}
      </div>

      {timeSheet.value && (
        <DateTimeSheet
          key={timeSheet.id}
          open={timeSheet.open}
          onOpenChange={timeSheet.onOpenChange}
          today={today}
          date={today}
          time={time}
          canLog={false}
          isLogging={false}
          timeOnly
          onSelect={(_date, next) => setTime(next)}
          onLog={() => undefined}
        />
      )}
    </>
  )
}

export function EntryEditDialog({ entry, open, onOpenChange, ...rest }: EntryEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !rest.isPending && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        // Không tự focus nút đầu tiên khi mở (tránh vòng focus và bàn phím bật ngoài ý muốn trên di động)
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="bg-background flex h-dvh max-h-dvh flex-col gap-0 rounded-none p-0 sm:h-[80dvh] sm:max-h-[80dvh] sm:max-w-lg sm:rounded-xl sm:p-0"
      >
        {entry && <EditBody key={entry.id} entry={entry} {...rest} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  )
}
