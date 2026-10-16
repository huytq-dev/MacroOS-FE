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
import type {
  CopyRequest,
  FoodLogEntry,
  PlateItem,
  UpdateEntryRequest,
} from '../types/food-log.types'
import { useFoodDetail, useFoodSearch } from '@/features/foods/hooks/use-foods'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { IconButton } from '@/components/shared/IconButton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MEAL_TYPE, type MealType } from '@/config/enums'
import { useDebounce } from '@/hooks/use-debounce'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, formatDateVi, todayIso } from '@/lib/date'
import { useUiStore } from '@/stores/ui.store'

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

  // Bảng Thêm món mở được từ nút + giữa thanh tab ở mọi trang nên trạng thái mở nằm trong ui.store
  const addOpen = useUiStore((state) => state.addFoodOpen)
  const setAddOpen = useUiStore((state) => state.setAddFoodOpen)
  const [tab, setTab] = useState<AddTab>('search')
  const [meal, setMeal] = useState<MealType>(mealForNow)
  const [search, setSearch] = useState('')
  const [top, setTop] = useState(SEARCH_PAGE)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [plate, setPlate] = useState<PlateItem[]>([])
  const [isLoggingPlate, setIsLoggingPlate] = useState(false)
  const [editing, setEditing] = useState<FoodLogEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FoodLogEntry | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const day = useDayLog(date)
  const debouncedSearch = useDebounce(search.trim(), 300)
  // Lazy: chỉ tìm khi sheet mở ở tab tìm món
  const foods = useFoodSearch(
    { search: debouncedSearch || undefined, scope: 'All', top },
    addOpen && tab === 'search'
  )
  const picked = useFoodDetail(pickedId)
  const editingFood = useFoodDetail(editing?.foodItemId ?? null)

  const addEntry = useAddEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const quickAdd = useQuickAdd()
  const copyLog = useCopyLog()
  const clearDay = useClearDay()

  const openAdd = (mealOverride?: MealType) => {
    setMeal(mealOverride ?? mealForNow())
    setPickedId(null)
    addEntry.reset()
    quickAdd.reset()
    setAddOpen(true)
  }

  const openCopy = () => {
    copyLog.reset()
    setCopyOpen(true)
  }

  const openEdit = (entry: FoodLogEntry) => {
    updateEntry.reset()
    setEditing(entry)
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
      // lỗi hiện inline trong sheet (addEntry.error); các món chưa log vẫn nằm trong plate để thử lại
    } finally {
      setIsLoggingPlate(false)
    }
  }

  const onQuickAdd = (values: QuickAddValues) => {
    if (!date) return
    quickAdd.mutate(
      { logDate: date, mealType: meal, eatenAt: null, ...values },
      { onSuccess: () => setAddOpen(false) }
    )
  }

  const onSaveEntry = (id: string, payload: UpdateEntryRequest) =>
    updateEntry.mutate({ id, payload }, { onSuccess: () => setEditing(null) })

  const onCopy = (payload: CopyRequest) =>
    copyLog.mutate(payload, {
      onSuccess: (count) => {
        toast.success(
          count === 0
            ? 'Không có món nào để sao chép'
            : `Đã sao chép ${count} món sang ${formatDateVi(payload.toDate)}`
        )
        setCopyOpen(false)
      },
    })

  if (day.isError) return <ErrorState error={day.error} onRetry={() => void day.refetch()} />

  const entries = day.data?.entries ?? []
  const isLoading = !date || day.isLoading
  // Lỗi xoá hiện inline ở đầu trang (xác nhận xoá đã đóng)
  const deleteError = deleteEntry.error ?? clearDay.error

  const addButton = (
    <Button size="sm" disabled={!date} onClick={() => openAdd()}>
      <Plus aria-hidden="true" /> Thêm món
    </Button>
  )

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader
        title="Nhật ký"
        action={
          <div className="flex items-center gap-1">
            {entries.length > 0 && (
              <>
                <IconButton icon={Copy} label="Sao chép nhật ký" onClick={openCopy} />
                <IconButton
                  icon={Trash2}
                  label="Xoá nhật ký ngày"
                  onClick={() => {
                    clearDay.reset()
                    setClearOpen(true)
                  }}
                />
              </>
            )}
            <span className="ml-1 hidden md:inline-flex">{addButton}</span>
          </div>
        }
      />

      <FormErrorAlert
        title="Không xoá được"
        message={deleteError ? getFormErrorMessage(deleteError) : null}
      />

      {date && <DateNav date={date} today={today} onChange={setSelectedDate} />}

      {isLoading || !day.data ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <>
          <DayTotals totals={day.data.totals} target={day.data.target} />
          {entries.length === 0 ? (
            <Card className="rounded-2xl">
              <EmptyState
                icon={UtensilsCrossed}
                title="Chưa có món nào"
                description="Thêm món đầu tiên của ngày để theo dõi kcal và macro."
                action={addButton}
              />
            </Card>
          ) : (
            MEAL_ORDER.map((mealType) => (
              <MealSection
                key={mealType}
                meal={mealType}
                entries={entries.filter((entry) => entry.mealType === mealType)}
                onSelectEntry={openEdit}
                onAddToMeal={openAdd}
              />
            ))
          )}
        </>
      )}

      <AddFoodDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tab={tab}
        onTabChange={setTab}
        meal={meal}
        onMealChange={setMeal}
        plate={plate}
        isLogging={isLoggingPlate}
        error={addEntry.error ? getFormErrorMessage(addEntry.error) : null}
        onRemoveFromPlate={(key) =>
          setPlate((current) => current.filter((item) => item.key !== key))
        }
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
          <QuickAddPanel
            isPending={quickAdd.isPending}
            error={quickAdd.error ? getFormErrorMessage(quickAdd.error) : null}
            onSubmit={onQuickAdd}
          />
        )}
      </AddFoodDialog>

      <EntryEditDialog
        entry={editing}
        food={editingFood.data ?? undefined}
        isFoodLoading={editingFood.isLoading}
        isPending={updateEntry.isPending}
        error={updateEntry.error ? getFormErrorMessage(updateEntry.error) : null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={onSaveEntry}
        onRequestDelete={(entry) => {
          deleteEntry.reset()
          setEditing(null)
          setDeleteTarget(entry)
        }}
      />

      {date && (
        <CopyDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          fromDate={date}
          defaultToDate={addDaysIso(date, 1)}
          isPending={copyLog.isPending}
          error={copyLog.error ? getFormErrorMessage(copyLog.error) : null}
          onCopy={onCopy}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá món này?"
        description={
          deleteTarget
            ? `Xoá ${deleteTarget.foodName} (${MEAL_TYPE[deleteTarget.mealType]}) khỏi nhật ký. Thực phẩm gốc vẫn được giữ.`
            : ''
        }
        confirmLabel="Xoá món"
        pendingLabel="Đang xoá..."
        isPending={deleteEntry.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteEntry.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: () => setDeleteTarget(null),
          })
        }
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Xoá nhật ký ngày?"
        description={
          date
            ? `Xoá toàn bộ món của ${formatDateVi(date)}. Thuật toán sẽ coi ngày này là chưa log.`
            : ''
        }
        confirmLabel="Xoá ngày"
        pendingLabel="Đang xoá..."
        isPending={clearDay.isPending}
        onConfirm={() =>
          date &&
          clearDay.mutate(date, {
            onSuccess: () => setClearOpen(false),
            onError: () => setClearOpen(false),
          })
        }
      />
    </div>
  )
}
