'use client'

import { useRef, useState } from 'react'
import {
  ArrowDown,
  BookOpen,
  ListFilter,
  Loader2,
  Rocket,
  ScanBarcode,
  Search,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MEAL_TYPE, type MealType } from '@/config/enums'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { EffectiveNutrition, MacroTotals, PlateItem } from '../../types/food-log.types'
import { SearchInput } from '@/components/shared/SearchInput'
import type { FoodLogSettings } from '../../food-log-settings'
import { cn } from '@/lib/utils'
import { AddFoodProgress } from './AddFoodProgress'
import { MealTimePill } from './MealTimePill'
import { PlatePanel } from './PlatePanel'
import { QUICK_ADD_FORM_ID } from './QuickAddPanel'

/** Kéo tay nắm quá ngưỡng này (px) mới đổi giữa bảng tab và Your Plate, tránh chạm nhẹ cũng đổi. */
const DRAG_THRESHOLD_PX = 40

export type AddTab = 'scan' | 'search' | 'ai' | 'quick' | 'library'

const TABS: readonly { value: AddTab; label: string; icon: typeof Search }[] = [
  { value: 'scan', label: 'Scan', icon: ScanBarcode },
  { value: 'search', label: 'Search', icon: Search },
  { value: 'ai', label: 'AI', icon: Sparkles },
  { value: 'quick', label: 'Quick Add', icon: Rocket },
  { value: 'library', label: 'Library', icon: BookOpen },
]

interface AddFoodDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly tab: AddTab
  readonly onTabChange: (tab: AddTab) => void
  readonly meal: MealType
  /** Ngày sẽ ghi (yyyy-MM-dd). */
  readonly logDate: string
  readonly eatenAt: string
  /** Bấm ô giờ: mở bảng Select Date and Time. */
  readonly onTimeClick: () => void
  readonly search: string
  readonly onSearchChange: (value: string) => void
  /** Màn Food Detail đang mở: chiếm hết khung (ẩn hàng tab và thanh đáy), chỉ giữ thanh calo trên cùng. */
  readonly detailOpen: boolean
  /** Ô lọc theo tên ở thanh đáy tab Library (thay ô tìm); chữ gợi ý đổi theo ngăn đang xem. */
  readonly libraryFilter: { value: string; placeholder: string; onChange: (value: string) => void }
  readonly plate: PlateItem[]
  /** Món đang xem nhưng chưa vào plate (kết quả AI Plate): chỉ cộng vào tổng ở thanh trên cùng. */
  readonly previewItems?: readonly PlateItem[]
  readonly totals?: MacroTotals
  /** Ngày hiệu lực của BE: có override thì thanh trên cùng hiện số hiệu lực + tổng Food Log riêng (plate không đổi override). */
  readonly effective?: EffectiveNutrition | null
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
  /** Lưu lượng mới của một dòng plate (sửa trong Your Plate). */
  readonly onUpdatePlateItem: (item: PlateItem) => void
  /** Ghi plate; `items` có khi vừa sửa lượng một dòng trong Your Plate. */
  readonly onLogPlate: (items?: PlateItem[]) => void
  readonly children: React.ReactNode
  /** Mở từ thanh Search của Dashboard: focus ô tìm ngay (mặc định không focus gì khi mở). */
  readonly autoFocusSearch?: boolean
}

/** Sheet thêm món: giờ ăn, 5 tab (Scan mã vạch, Search, AI, Quick Add, Library), "plate" gom nhiều món rồi log một lượt ở thanh đáy. */
export function AddFoodDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
  meal,
  logDate,
  eatenAt,
  onTimeClick,
  search,
  onSearchChange,
  detailOpen,
  libraryFilter,
  plate,
  previewItems = [],
  totals,
  effective,
  target,
  settings,
  isLogging,
  error,
  onRemoveFromPlate,
  onUpdatePlateItem,
  onLogPlate,
  children,
  autoFocusSearch = false,
}: AddFoodDialogProps) {
  const [plateOpen, setPlateOpen] = useState(false)
  const dragStartY = useRef<number | null>(null)
  // Đóng bảng Thêm món (kể cả khi ghi xong) thì lần mở sau bắt đầu ở tab, không ở Your Plate.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setPlateOpen(false)
  }
  // "+" chỉ đưa món vào plate: nút ghi nói rõ đang chờ ghi bao nhiêu món ("Log 4 foods"), không còn là "Log Foods" chung chung
  const logLabel =
    plate.length === 0
      ? 'Log Foods'
      : `Log ${plate.length} ${plate.length === 1 ? 'food' : 'foods'}`
  const counted = [...plate, ...previewItems]
  const plateKcal = counted.reduce((sum, item) => sum + item.calories, 0)
  const plateTotals: MacroTotals = {
    calories: plateKcal,
    protein: counted.reduce((sum, item) => sum + item.protein, 0),
    carbs: counted.reduce((sum, item) => sum + item.carbs, 0),
    fat: counted.reduce((sum, item) => sum + item.fat, 0),
    fiber: 0,
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !isLogging && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        // Không tự focus nút đầu tiên (tab Scan) khi mở: tránh vòng focus cam và bàn phím bật ngoài ý muốn trên di động.
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="bg-background flex h-dvh max-h-dvh flex-col gap-0 rounded-none p-0 max-sm:h-(--vv-height) max-sm:max-h-(--vv-height) sm:h-[80dvh] sm:max-h-[80dvh] sm:max-w-lg sm:rounded-xl sm:p-0"
      >
        <DialogHeader className="relative z-20 space-y-0">
          <DialogTitle className="sr-only">Add food</DialogTitle>
          <DialogDescription className="sr-only">
            Scan a barcode, search for a food or quick add calories and macros
          </DialogDescription>
          <div className="flex items-center gap-2 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
            <button
              type="button"
              aria-label="Close"
              disabled={isLogging}
              onClick={() => onOpenChange(false)}
              className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <MealTimePill time={eatenAt} mealLabel={MEAL_TYPE[meal]} onClick={onTimeClick} />
            <AddFoodProgress
              totals={totals}
              effective={effective}
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
            <div className="bg-secondary flex h-11 shrink-0 items-center rounded-full pl-1">
              <button
                type="button"
                aria-label={`${plate.length} ${plate.length === 1 ? 'item' : 'items'} in plate`}
                aria-expanded={plateOpen}
                onClick={() => setPlateOpen((current) => !current)}
                className="focus-visible:ring-ring/50 h-11 min-w-11 rounded-full focus-visible:ring-1 focus-visible:outline-none"
              >
                {/* key = số món: thêm món thì viên thuốc dựng lại và nảy lên một nhịp (tắt khi giảm chuyển động) */}
                <span
                  key={plate.length}
                  className="motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:animation-duration-300 flex items-center gap-1.5 text-base tabular-nums"
                >
                  {plate.length === 0 ? (
                    <Utensils aria-hidden="true" className="text-muted-foreground size-5" />
                  ) : (
                    <FoodIcon iconKey={plate[0].iconKey} emoji={plate[0].emoji} size={28} />
                  )}
                  {plate.length > 1 && <span className="font-medium">+{plate.length - 1}</span>}
                </span>
              </button>
              <button
                type="button"
                aria-label={plateOpen ? 'Hide plate' : 'Show plate'}
                aria-expanded={plateOpen}
                onClick={() => setPlateOpen((current) => !current)}
                className="bg-foreground/15 focus-visible:ring-ring/50 active:bg-foreground/25 flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
              >
                <ArrowDown
                  aria-hidden="true"
                  className={cn(
                    'size-5 transition-transform duration-300 motion-reduce:transition-none',
                    plateOpen && 'rotate-180'
                  )}
                />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/*
          Your Plate và tấm sheet tab chia chiều cao bằng flex-grow (đổi 0 ↔ 1 trong 300ms): mở plate thì plate trượt xuống chiếm
          chỗ, sheet thu thành thanh nhỏ (tay nắm + hàng tab) ở đáy; đóng thì ngược lại. Cả hai luôn mount nên hoạt ảnh đóng kịp chạy.
        */}
        <div
          inert={!plateOpen}
          aria-hidden={!plateOpen}
          className={cn(
            'min-h-0 basis-0 overflow-hidden transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none',
            plateOpen ? 'grow' : 'grow-0'
          )}
        >
          <PlatePanel
            open={plateOpen}
            date={logDate}
            plate={plate}
            plateTotals={plateTotals}
            target={target}
            isLogging={isLogging}
            onRemove={onRemoveFromPlate}
            onUpdate={onUpdatePlateItem}
            onAddFoods={() => setPlateOpen(false)}
            onLog={(items) => {
              if (!isLogging) onLogPlate(items)
            }}
          />
        </div>

        <div
          className={cn(
            'bg-card flex min-h-0 flex-col rounded-t-3xl transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none',
            plateOpen ? 'grow-0' : 'grow'
          )}
        >
          {/*
            Tay nắm kéo như MacroFactor: kéo xuống ≥ 40px mở Your Plate (sheet thu xuống đáy), kéo lên đóng lại. Vùng chạm cao 24px,
            touch-none để trình duyệt không cuộn trang khi kéo. Nút mũi tên trên header vẫn là cách thao tác cho bàn phím / trình đọc màn hình.
          */}
          <div
            aria-hidden="true"
            onPointerDown={(event) => {
              dragStartY.current = event.clientY
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerUp={(event) => {
              const start = dragStartY.current
              dragStartY.current = null
              if (start === null) return
              const delta = event.clientY - start
              if (delta > DRAG_THRESHOLD_PX) setPlateOpen(true)
              else if (delta < -DRAG_THRESHOLD_PX) setPlateOpen(false)
            }}
            onPointerCancel={() => {
              dragStartY.current = null
            }}
            className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          >
            <span className="bg-foreground/20 h-1 w-10 rounded-full" />
          </div>
          {(!detailOpen || plateOpen) && (
            <Tabs value={tab} onValueChange={(next) => onTabChange(next as AddTab)}>
              <TabsList variant="line" className="w-full overflow-x-auto border-b">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    onClick={() => setPlateOpen(false)}
                    className="h-11 flex-1 gap-1 px-1 text-[13px] whitespace-nowrap group-data-horizontal/tabs:after:bottom-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none"
                  >
                    <Icon aria-hidden="true" className="size-3.5" /> {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          {/* Thân tab thu về 0 khi plate mở nhưng vẫn mount để giữ trạng thái (camera, ô tìm, món đang xem). */}
          <div
            inert={plateOpen}
            className={cn(
              'flex min-h-0 basis-0 flex-col overflow-hidden transition-[flex-grow,opacity] duration-300 ease-out motion-reduce:transition-none',
              plateOpen ? 'grow-0 opacity-0' : 'grow opacity-100'
            )}
          >
            {error && (
              <div className="px-4 pb-2">
                <FormErrorAlert title="Couldn't add food" message={error} />
              </div>
            )}

            {tab === 'scan' || tab === 'ai' || detailOpen ? (
              <div className="min-h-0 flex-1">{children}</div>
            ) : (
              <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
            )}

            {!detailOpen &&
              (tab === 'search' || tab === 'library' || tab === 'quick' || plate.length > 0) && (
                <div className="bg-card space-y-2 rounded-t-2xl px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--border)]">
                  {tab === 'quick' ? (
                    // Như MacroFactor: "Quick Add" xám (thêm vào plate) nằm trên "Log Foods" trắng, cả hai rộng hết hàng.
                    <>
                      <Button
                        type="submit"
                        form={QUICK_ADD_FORM_ID}
                        variant="secondary"
                        className="h-14 w-full rounded-lg text-base"
                      >
                        Quick Add
                      </Button>
                      <Button
                        className="bg-foreground text-background h-14 w-full rounded-lg text-base"
                        disabled={isLogging || plate.length === 0}
                        aria-busy={isLogging}
                        onClick={() => {
                          if (!isLogging) onLogPlate()
                        }}
                      >
                        {isLogging && (
                          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                        )}
                        {isLogging ? 'Logging...' : logLabel}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      {tab === 'search' && (
                        <div className="min-w-0 flex-1">
                          <SearchInput
                            value={search}
                            onValueChange={onSearchChange}
                            placeholder="Search for a food"
                            aria-label="Search for a food"
                            autoFocus={autoFocusSearch}
                          />
                        </div>
                      )}
                      {tab === 'library' && (
                        <div className="min-w-0 flex-1">
                          <SearchInput
                            icon={ListFilter}
                            value={libraryFilter.value}
                            onValueChange={libraryFilter.onChange}
                            placeholder={libraryFilter.placeholder}
                            aria-label={libraryFilter.placeholder}
                          />
                        </div>
                      )}
                      {(plate.length > 0 || tab === 'search' || tab === 'library') && (
                        <Button
                          className={
                            tab === 'search' || tab === 'library'
                              ? 'h-12 shrink-0 rounded-full px-5 text-base'
                              : 'h-12 w-full rounded-full text-base'
                          }
                          disabled={isLogging || plate.length === 0}
                          aria-busy={isLogging}
                          onClick={() => {
                            if (!isLogging) onLogPlate()
                          }}
                        >
                          {isLogging && (
                            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                          )}
                          {isLogging ? 'Logging...' : logLabel}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
