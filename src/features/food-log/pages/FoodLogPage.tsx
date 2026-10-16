'use client'

import { useState } from 'react'
import { Copy, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAddEntry,
  useClearDay,
  useCopyLog,
  useDayLog,
  useDeleteEntry,
  useQuickAdd,
  useUpdateEntry,
} from '../hooks/use-food-log'
import {
  AddFoodDialog,
  CopyDialog,
  DateNav,
  DayTotals,
  EntryEditDialog,
  FoodSearchPanel,
  MealSection,
  QuickAddPanel,
  type AddTab,
  type QuickAddValues,
} from '../components/FoodLogPage'
import type { CopyRequest, FoodLogEntry, PlateItem, UpdateEntryRequest } from '../types/food-log.types'
import { useFoodDetail, useFoodSearch } from '@/features/foods/hooks/use-foods'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MEAL_TYPE, type MealType } from '@/config/enums'
import { useDebounce } from '@/hooks/use-debounce'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, formatDateVi, todayIso } from '@/lib/date'

const SEARCH_PAGE = 25
const MEAL_ORDER = Object.keys(MEAL_TYPE) as MealType[]

/** Gợi ý bữa mặc định theo giờ hiện tại (chỉ gọi trong event handler, không trong render). */
const mealForNow = (): MealType => {
  const hour = new Date().getHours()
  if (hour < 10) return 'Breakfast'
  if (hour < 12) return 'MorningSnack'
  if (hour < 14) return 'Lunch'
  if (hour < 17) return 'AfternoonSnack'
  if (hour < 21) return 'Dinner'
  return 'EveningSnack'
}

export function FoodLogPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const date = selectedDate ?? today

  const [addOpen, setAddOpen] = useState(false)
  const [tab, setTab] = useState<AddTab>('search')
  const [meal, setMeal] = useState<MealType>('Breakfast')
  const [search, setSearch] = useState('')
  const [top, setTop] = useState(SEARCH_PAGE)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [plate, setPlate] = useState<PlateItem[]>([])
  const [isLoggingPlate, setIsLoggingPlate] = useState(false)
  const [editing, setEditing] = useState<FoodLogEntry | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const day = useDayLog(date)
  const debouncedSearch = useDebounce(search.trim(), 300)
  // Lazy: chỉ tìm khi sheet mở ở tab tìm món
  const foods = useFoodSearch({ search: debouncedSearch || undefined, scope: 'All', top }, addOpen && tab === 'search')
  const picked = useFoodDetail(pickedId)
  const editingFood = useFoodDetail(editing?.foodItemId ?? null)

  const addEntry = useAddEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const quickAdd = useQuickAdd()
  const copyLog = useCopyLog()
  const clearDay = useClearDay()

  const openAdd = () => {
    setMeal(mealForNow())
    setPickedId(null)
    setAddOpen(true)
  }

  const logPlate = async () => {
    if (!date || plate.length === 0) return
    setIsLoggingPlate(true)
    try {
      // Tuần tự: song song sẽ cùng tạo FoodLog của ngày và đụng unique (UserId, LogDate)
      for (const item of plate) {
        await addEntry.mutateAsync({
          logDate: date,
          mealType: meal,
          eatenAt: null,
          foodItemId: item.foodItemId,
          foodServingId: item.foodServingId,
          quantity: item.quantity,
        })
        setPlate((current) => current.filter((candidate) => candidate.key !== item.key))
      }
      toast.success(`Đã thêm ${plate.length} món`)
      setAddOpen(false)
    } catch {
      // toast lỗi đã hiện trong hook; các món chưa log vẫn nằm trong plate để thử lại
    } finally {
      setIsLoggingPlate(false)
    }
  }

  const onQuickAdd = (values: QuickAddValues) => {
    if (!date) return
    quickAdd.mutate({ logDate: date, mealType: meal, eatenAt: null, ...values }, { onSuccess: () => setAddOpen(false) })
  }

  const onSaveEntry = (id: string, payload: UpdateEntryRequest) =>
    updateEntry.mutate({ id, payload }, { onSuccess: () => setEditing(null) })

  const onCopy = (payload: CopyRequest) =>
    copyLog.mutate(payload, {
      onSuccess: (count) => {
        toast.success(count === 0 ? 'Không có món nào để sao chép' : `Đã sao chép ${count} món sang ${formatDateVi(payload.toDate)}`)
        setCopyOpen(false)
      },
    })

  if (day.isError) return <ErrorState error={day.error} onRetry={() => void day.refetch()} />

  const entries = day.data?.entries ?? []
  const isLoading = !date || day.isLoading

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Nhật ký</h1>
        {entries.length > 0 && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label="Sao chép" onClick={() => setCopyOpen(true)}>
              <Copy />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Xoá nhật ký ngày" onClick={() => setClearOpen(true)}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {date && <DateNav date={date} today={today} onChange={setSelectedDate} />}

      {isLoading || !day.data ? (
        <>
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </>
      ) : (
        <>
          <DayTotals totals={day.data.totals} target={day.data.target} />
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
              <UtensilsCrossed className="text-muted-foreground size-8" aria-hidden="true" />
              <p className="text-sm font-medium">Chưa có món nào</p>
              <p className="text-muted-foreground text-xs">Chạm nút + để thêm món đầu tiên của ngày.</p>
            </div>
          ) : (
            MEAL_ORDER.map((mealType) => (
              <MealSection
                key={mealType}
                meal={mealType}
                entries={entries.filter((entry) => entry.mealType === mealType)}
                onSelectEntry={setEditing}
              />
            ))
          )}
        </>
      )}

      <Button
        size="icon-lg"
        className="fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-40 size-14 rounded-full shadow-lg md:right-8 md:bottom-8"
        aria-label="Thêm món"
        disabled={!date}
        onClick={openAdd}
      >
        <Plus className="size-6" />
      </Button>

      <AddFoodDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tab={tab}
        onTabChange={setTab}
        meal={meal}
        onMealChange={setMeal}
        plate={plate}
        isLogging={isLoggingPlate}
        onRemoveFromPlate={(key) => setPlate((current) => current.filter((item) => item.key !== key))}
        onLogPlate={() => void logPlate()}
      >
        {tab === 'search' ? (
          <FoodSearchPanel
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              setTop(SEARCH_PAGE)
            }}
            items={foods.data?.items ? [...foods.data.items] : []}
            totalCount={foods.data?.totalCount ?? null}
            isLoading={foods.isLoading}
            isFetching={foods.isFetching}
            onLoadMore={() => setTop((current) => current + SEARCH_PAGE)}
            pickedId={pickedId}
            picked={picked.data ?? undefined}
            onPick={(food) => setPickedId(food.id)}
            onBack={() => setPickedId(null)}
            onAddToPlate={(item) => {
              setPlate((current) => [...current, item])
              setPickedId(null)
            }}
          />
        ) : (
          <QuickAddPanel isPending={quickAdd.isPending} onSubmit={onQuickAdd} />
        )}
      </AddFoodDialog>

      <EntryEditDialog
        entry={editing}
        food={editingFood.data ?? undefined}
        isFoodLoading={editingFood.isLoading}
        isPending={updateEntry.isPending || deleteEntry.isPending}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={onSaveEntry}
        onDelete={(id) => deleteEntry.mutate(id, { onSuccess: () => setEditing(null) })}
      />

      {date && (
        <CopyDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          fromDate={date}
          defaultToDate={addDaysIso(date, 1)}
          isPending={copyLog.isPending}
          onCopy={onCopy}
        />
      )}

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Xoá nhật ký ngày?"
        description={date ? `Xoá toàn bộ món của ${formatDateVi(date)}. Thuật toán sẽ coi ngày này là chưa log.` : ''}
        confirmLabel="Xoá ngày"
        isPending={clearDay.isPending}
        onConfirm={() => date && clearDay.mutate(date, { onSuccess: () => setClearOpen(false) })}
      />
    </div>
  )
}
