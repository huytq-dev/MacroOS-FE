'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useAddEntry,
  useAddNote,
  useClearDay,
  useCopyLog,
  useDayLog,
  useDeleteEntry,
  useDeleteNote,
  useQuickAdd,
  useSetDayStatus,
  useUpdateEntry,
  useUpdateNote,
} from '../hooks/use-food-log'
import {
  AddFoodDialog,
  BarcodeSheet,
  CalendarSheet,
  CopyDialog,
  DayTimeline,
  EntryEditDialog,
  FoodLogHeader,
  FoodSearchPanel,
  type FoodView,
  NoteSheet,
  NotesSection,
  QuickAddPanel,
  type AddTab,
  type QuickAddValues,
} from '../components/FoodLogPage'
import type {
  CopyRequest,
  FoodLogEntry,
  FoodLogNote,
  MacroTotals,
  PlateItem,
  UpdateEntryRequest,
} from '../types/food-log.types'
import { toNotes } from '../types/food-log.types'
import { useBarcodeLookup, useFoodDetail, useFoodSearch } from '@/features/foods/hooks/use-foods'
import {
  useAddFavorite,
  useFavorites,
  useRemoveFavorite,
  useReorderFavorites,
} from '@/features/foods/hooks/use-favorites'
import { loggerTileOptions, timelineTileOptions } from '../food-log-settings'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DashboardSearchBar } from '@/features/dashboard/components/DashboardPage'
import { Skeleton } from '@/components/ui/skeleton'
import { MEAL_TYPE, mealForTime, type FoodCategory, type MealType } from '@/config/enums'
import { useDebounce } from '@/hooks/use-debounce'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, formatDateVi, todayIso } from '@/lib/date'
import { useUiStore } from '@/stores/ui.store'

const SEARCH_PAGE = 25
const EMPTY_TOTALS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

/** Giờ hiện tại dạng HH:mm (chỉ gọi trong event handler/khởi tạo state, không trong render). */
const nowHourMinute = (): string => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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
  // Giờ ăn là nguồn chính; bữa suy ra từ giờ (đổi giờ thì bữa đổi theo, mở từ nút + của bữa thì giờ lấy theo bữa).
  const [eatenAt, setEatenAt] = useState<string>(nowHourMinute)
  const [meal, setMeal] = useState<MealType>(() => mealForTime(nowHourMinute()))
  const [search, setSearch] = useState('')
  const [view, setView] = useState<FoodView>('all')
  const [category, setCategory] = useState<FoodCategory | null>(null)
  const [top, setTop] = useState(SEARCH_PAGE)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [plate, setPlate] = useState<PlateItem[]>([])
  const [isLoggingPlate, setIsLoggingPlate] = useState(false)
  const [editing, setEditing] = useState<FoodLogEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FoodLogEntry | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  // Ghi chú đang mở trong bảng: undefined = đóng, null = thêm mới, còn lại = sửa.
  const [noteEditor, setNoteEditor] = useState<FoodLogNote | null | undefined>(undefined)
  const [settings] = useFoodLogSettings()
  // Giờ hiện tại cho chấm "Now" trên timeline: chốt lúc mở trang (đổi giờ thì lần mở sau sẽ cập nhật).
  const [currentHour] = useState(() => new Date().getHours())

  const day = useDayLog(date)
  const debouncedSearch = useDebounce(search.trim(), 300)
  // Lazy: chỉ tìm khi sheet mở ở tab tìm món
  const foods = useFoodSearch(
    {
      search: debouncedSearch || undefined,
      category: category ?? undefined,
      scope: view === 'mine' ? 'Mine' : 'All',
      top,
    },
    addOpen && tab === 'search' && view !== 'favorites'
  )
  // Lazy: yêu thích chỉ tải khi sheet Thêm món mở ở tab tìm món.
  const favorites = useFavorites(addOpen && tab === 'search')
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const reorderFavorites = useReorderFavorites()
  const picked = useFoodDetail(pickedId)
  const editingFood = useFoodDetail(editing?.foodItemId ?? null)

  const addEntry = useAddEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const quickAdd = useQuickAdd()
  const copyLog = useCopyLog()
  const clearDay = useClearDay()
  const setStatus = useSetDayStatus()
  const addNote = useAddNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const barcode = useBarcodeLookup()

  /** Mở bảng Thêm món; `time` (HH:mm) là giờ ăn, mặc định giờ hiện tại, bữa suy ra từ giờ. */
  const openAdd = (time: string = nowHourMinute()) => {
    setEatenAt(time)
    setMeal(mealForTime(time))
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
          eatenAt: `${eatenAt}:00`,
          foodItemId: item.foodItemId,
          foodServingId: item.foodServingId,
          quantity: item.quantity,
        })
        setPlate((current) => current.filter((candidate) => candidate.key !== item.key))
      }
      toast.success(`Added ${plate.length} ${plate.length === 1 ? 'item' : 'items'}`)
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
      { logDate: date, mealType: meal, eatenAt: `${eatenAt}:00`, ...values },
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
            ? 'Nothing to copy'
            : `Copied ${count} ${count === 1 ? 'item' : 'items'} to ${formatDateVi(payload.toDate)}`
        )
        setCopyOpen(false)
      },
    })

  if (day.isError) return <ErrorState error={day.error} onRetry={() => void day.refetch()} />

  const entries = day.data?.entries ?? []
  const isLoading = !date || day.isLoading
  // Lỗi xoá hiện inline ở đầu trang (xác nhận xoá đã đóng)
  const deleteError = deleteEntry.error ?? clearDay.error

  const header = date && (
    <FoodLogHeader
      date={date}
      today={today}
      onDateChange={(next) => {
        setSelectedDate(next)
        setCalendarOpen(false)
      }}
      totals={day.data?.totals ?? EMPTY_TOTALS}
      target={day.data?.target ?? null}
      showOverages={settings.overages === 'ShowOverages'}
      weekBanner={settings.weekBanner}
      calendarScrolling={settings.calendarScrolling}
      calendarOpen={calendarOpen}
      onCalendarToggle={() => setCalendarOpen((open) => !open)}
      status={day.data?.status ?? 'Unmarked'}
      onStatusChange={(status) =>
        setStatus.mutate(
          { date, status },
          { onError: (error) => toast.error(getFormErrorMessage(error)) }
        )
      }
      hasEntries={entries.length > 0}
      onCopy={openCopy}
      onClear={() => {
        clearDay.reset()
        setClearOpen(true)
      }}
    />
  )

  return (
    <div className="flex max-w-2xl flex-col gap-5 pb-24 md:pb-0">
      {header}

      <FormErrorAlert
        title="Couldn't delete"
        message={deleteError ? getFormErrorMessage(deleteError) : null}
      />

      {calendarOpen && date && (
        <CalendarSheet
          date={date}
          today={today}
          onSelect={(next) => {
            setSelectedDate(next)
            setCalendarOpen(false)
          }}
        />
      )}

      {isLoading || !day.data ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : (
        <>
          <DayTimeline
            entries={entries}
            firstHour={settings.hourRangeFirst}
            lastHour={settings.hourRangeLast}
            currentHour={date === today ? currentHour : null}
            showTimestamps={settings.showTimestamps}
            showHourlyTotals={settings.showHourlyTotals}
            alignRight={settings.alignment === 'Right'}
            longPressToAdd={settings.addFoodsToHour === 'LongPress'}
            tileSettings={timelineTileOptions(settings)}
            onAddAt={openAdd}
            onSelectEntry={openEdit}
          />
          <NotesSection
            notes={toNotes(day.data.notes)}
            onAdd={() => {
              addNote.reset()
              setNoteEditor(null)
            }}
            onSelect={(note) => {
              updateNote.reset()
              setNoteEditor(note)
            }}
          />
        </>
      )}

      {!calendarOpen && (
        <DashboardSearchBar
          onSearch={() => openAdd()}
          onScan={() => {
            barcode.reset()
            setBarcodeOpen(true)
          }}
        />
      )}

      {noteEditor !== undefined && date && (
        <NoteSheet
          open
          onOpenChange={(open) => !open && setNoteEditor(undefined)}
          note={noteEditor}
          defaultTime={nowHourMinute()}
          isPending={addNote.isPending || updateNote.isPending || deleteNote.isPending}
          error={
            (addNote.error ?? updateNote.error ?? deleteNote.error)
              ? getFormErrorMessage(addNote.error ?? updateNote.error ?? deleteNote.error)
              : null
          }
          onSave={({ text, notedAt }) =>
            noteEditor
              ? updateNote.mutate(
                  { id: noteEditor.id, payload: { text, notedAt } },
                  { onSuccess: () => setNoteEditor(undefined) }
                )
              : addNote.mutate(
                  { logDate: date, text, notedAt },
                  { onSuccess: () => setNoteEditor(undefined) }
                )
          }
          onDelete={(note) =>
            deleteNote.mutate(note.id, { onSuccess: () => setNoteEditor(undefined) })
          }
        />
      )}

      {barcodeOpen && (
        <BarcodeSheet
          open
          onOpenChange={(open) => !open && setBarcodeOpen(false)}
          isPending={barcode.isPending}
          error={barcode.error ? getFormErrorMessage(barcode.error) : null}
          onLookup={(code) =>
            barcode.mutate(code, {
              onSuccess: (food) => {
                if (!food) return
                setBarcodeOpen(false)
                setTab('search')
                openAdd()
                setPickedId(food.id)
              },
            })
          }
        />
      )}

      <AddFoodDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tab={tab}
        onTabChange={setTab}
        meal={meal}
        eatenAt={eatenAt}
        onEatenAtChange={(time) => {
          setEatenAt(time)
          setMeal(mealForTime(time))
        }}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setTop(SEARCH_PAGE)
        }}
        plate={plate}
        totals={day.data?.totals}
        target={day.data?.target}
        settings={settings}
        isLogging={isLoggingPlate}
        error={addEntry.error ? getFormErrorMessage(addEntry.error) : null}
        onRemoveFromPlate={(key) =>
          setPlate((current) => current.filter((item) => item.key !== key))
        }
        onLogPlate={() => void logPlate()}
      >
        {tab === 'search' ? (
          <FoodSearchPanel
            view={view}
            onViewChange={(next) => {
              setView(next)
              setTop(SEARCH_PAGE)
            }}
            category={category}
            onCategoryChange={(next) => {
              setCategory(next)
              setTop(SEARCH_PAGE)
            }}
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
            favorites={favorites.data ?? []}
            isFavoritePending={addFavorite.isPending || removeFavorite.isPending}
            onAddFavorite={(foodItemId, foodServingId, quantity) =>
              addFavorite.mutate({ foodItemId, foodServingId, quantity })
            }
            onRemoveFavorite={(id) => removeFavorite.mutate(id)}
            onReorderFavorites={(ids) => reorderFavorites.mutate(ids)}
            tileOptions={loggerTileOptions(settings)}
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
        title="Delete this food?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.foodName} (${MEAL_TYPE[deleteTarget.mealType]}) from your food log. The original food is kept.`
            : ''
        }
        confirmLabel="Delete food"
        pendingLabel="Deleting..."
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
        title="Delete this day's log?"
        description={
          date
            ? `Delete all foods logged on ${formatDateVi(date)}. The algorithm will treat this day as not logged.`
            : ''
        }
        confirmLabel="Delete day"
        pendingLabel="Deleting..."
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
