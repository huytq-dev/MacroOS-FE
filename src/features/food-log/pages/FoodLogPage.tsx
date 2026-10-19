'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { routePath } from '@/config/route-path'
import {
  useAddEntry,
  useAddNote,
  useClearDay,
  useCopyLog,
  useDayLog,
  useDeleteEntry,
  useDeleteNote,
  useAiPlate,
  useLibrary,
  useQuickAdd,
  useUpdateEntry,
  useUpdateNote,
} from '../hooks/use-food-log'
import {
  AddFoodDialog,
  AiPanel,
  BarcodeSheet,
  ScanPanel,
  LibraryPanel,
  CalendarSheet,
  CopyDialog,
  DateTimeSheet,
  DayTimeline,
  EntryEditDialog,
  FoodLogHeader,
  MoreSheet,
  FoodSearchPanel,
  NoteSheet,
  NotesSection,
  QuickAddPanel,
  targetsByKey,
  type AddTab,
  type LibraryView,
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
import {
  useBarcodeLookup,
  useFoodDetail,
  useFoodNutrients,
  useFoodSearch,
} from '@/features/foods/hooks/use-foods'
import type { FoodDetail } from '@/features/foods/types/food.types'
import {
  useAddFavorite,
  useFavorites,
  useRemoveFavorite,
} from '@/features/foods/hooks/use-favorites'
import { loggerTileOptions, timelineTileOptions, type TileOptions } from '../food-log-settings'
import { usePersistedChoice } from '@/features/dashboard/hooks/use-dashboard'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DashboardSearchBar } from '@/features/dashboard/components/DashboardPage'
import { Skeleton } from '@/components/ui/skeleton'
import { mealForTime, type MealType } from '@/config/enums'
import { useDebounce } from '@/hooks/use-debounce'
import { useIsClient } from '@/hooks/use-is-client'
import { useSheet } from '@/hooks/use-sheet'
import { liveIngredients, toPlateItem } from '../ai-plate.utils'
import { addDaysIso, formatDateVi, todayIso } from '@/lib/date'
import { useUiStore, type AddFoodRequest } from '@/stores/ui.store'

const SEARCH_PAGE = 25
const VISIBILITY = ['show', 'hide'] as const
/** Hide Food Details: ô món chỉ còn tên và kcal (tắt macro, khẩu phần, khối lượng). */
const HIDDEN_DETAILS = (options: TileOptions): TileOptions => ({
  ...options,
  showMacros: false,
  showWeight: false,
  showServing: false,
})
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
  // Ngày ghi do bảng Select Date and Time chọn; null = ngày đang xem trên timeline.
  const [logDate, setLogDate] = useState<string | null>(null)
  const [meal, setMeal] = useState<MealType>(() => mealForTime(nowHourMinute()))
  const [search, setSearch] = useState('')
  const [top, setTop] = useState(SEARCH_PAGE)
  const [libraryView, setLibraryView] = useState<LibraryView>('foods')
  const [libraryFilter, setLibraryFilter] = useState('')
  const [libraryTop, setLibraryTop] = useState(SEARCH_PAGE)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [plate, setPlate] = useState<PlateItem[]>([])
  const [isLoggingPlate, setIsLoggingPlate] = useState(false)
  // Bảng này còn mount sau khi đóng để hoạt ảnh trượt xuống kịp chạy (useSheet).
  const editSheet = useSheet<FoodLogEntry>()
  const editing = editSheet.value ?? null
  const [copyOpen, setCopyOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  // Lịch còn mount thêm một nhịp sau khi đóng để chạy hoạt ảnh đóng (CalendarSheet gọi onExited khi xong)
  const [calendarMounted, setCalendarMounted] = useState(false)
  if (calendarOpen && !calendarMounted) setCalendarMounted(true)
  const barcodeSheet = useSheet<true>()
  const dateTimeSheet = useSheet<true>()
  const moreSheet = useSheet<true>()
  const [hideDetails, setHideDetails] = usePersistedChoice(
    'food-log.hideDetails',
    'show',
    VISIBILITY
  )
  const [hideEmptyHours, setHideEmptyHours] = usePersistedChoice(
    'food-log.hideEmptyHours',
    'show',
    VISIBILITY
  )
  // Ghi chú đang mở trong bảng: undefined = đóng, null = thêm mới, còn lại = sửa.
  const noteSheet = useSheet<FoodLogNote | null>()
  const noteEditor = noteSheet.value
  const [settings] = useFoodLogSettings()
  // Giờ hiện tại cho chấm "Now" trên timeline: chốt lúc mở trang (đổi giờ thì lần mở sau sẽ cập nhật).
  const [currentHour] = useState(() => new Date().getHours())

  const day = useDayLog(date)
  const debouncedSearch = useDebounce(search.trim(), 300)
  // Lazy: chỉ tìm khi sheet mở ở tab tìm món
  const foods = useFoodSearch(
    {
      search: debouncedSearch || undefined,
      top,
    },
    addOpen && tab === 'search'
  )
  // Lazy: món tự tạo chỉ tải khi Library mở ở ngăn Foods; yêu thích khi ở tab tìm món hoặc ngăn ♥.
  const myFoods = useFoodSearch(
    { scope: 'Mine', top: libraryTop },
    addOpen && tab === 'library' && libraryView === 'foods'
  )
  const favorites = useFavorites(
    editSheet.open ||
      (addOpen && (tab === 'search' || (tab === 'library' && libraryView === 'favorites')))
  )
  // Recipe lọc tên ở server; debounce để không gọi lại mỗi phím.
  const debouncedLibraryFilter = useDebounce(libraryFilter.trim(), 300)
  const recipes = useLibrary(
    { scope: 'Recipes', search: debouncedLibraryFilter || undefined, top: libraryTop },
    addOpen && tab === 'library' && libraryView === 'recipes'
  )
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const picked = useFoodDetail(pickedId)
  // Target/floor/ceiling của ngày đang log, một lần cho mỗi món xem; lỗi (BE chưa có) thì các chất hiện "No Target".
  const foodNutrients = useFoodNutrients(pickedId, date)
  const router = useRouter()
  const editingFood = useFoodDetail(editing?.foodItemId ?? null)
  const editingNutrients = useFoodNutrients(editing?.foodItemId ?? null, date)

  const addEntry = useAddEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const quickAdd = useQuickAdd()
  const copyLog = useCopyLog()
  const clearDay = useClearDay()
  const addNote = useAddNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const barcode = useBarcodeLookup()
  const aiPlate = useAiPlate()

  // Shortcut / toolbar ở trang khác mở bảng Thêm món ở một tab: áp dụng ngay trong render (như mở từ nút giờ), rồi xoá yêu cầu.
  const addRequest = useUiStore((state) => state.addFoodRequest)
  const clearAddRequest = useUiStore((state) => state.clearAddFoodRequest)
  const [appliedRequest, setAppliedRequest] = useState<AddFoodRequest | null>(null)
  if (addRequest && addRequest !== appliedRequest) {
    setAppliedRequest(addRequest)
    const time = nowHourMinute()
    setEatenAt(time)
    setLogDate(null)
    setMeal(mealForTime(time))
    setPickedId(null)
    setTab(addRequest.tab)
    if (addRequest.libraryView) {
      setLibraryView(addRequest.libraryView)
      setLibraryFilter('')
    }
  }
  useEffect(() => {
    if (!addRequest) return
    addEntry.reset()
    quickAdd.reset()
    if (addRequest.tab === 'scan') barcode.reset()
    clearAddRequest()
  }, [addRequest, addEntry, quickAdd, barcode, clearAddRequest])

  /** Mở bảng Thêm món; `time` (HH:mm) là giờ ăn, mặc định giờ hiện tại, bữa suy ra từ giờ. */
  const openAdd = (time: string = nowHourMinute()) => {
    setEatenAt(time)
    setLogDate(null)
    setMeal(mealForTime(time))
    setPickedId(null)
    addEntry.reset()
    quickAdd.reset()
    setAddOpen(true)
  }

  /** Tra mã vạch (quét hoặc nhập tay): tìm thấy thì chuyển sang tab Search với món đó đang được chọn. */
  const lookupBarcode = (code: string, onFound?: () => void) =>
    barcode.mutate(code, {
      onSuccess: (food) => {
        if (!food) return
        onFound?.()
        setTab('search')
        setPickedId(food.id)
      },
    })

  const openCopy = () => {
    copyLog.reset()
    setCopyOpen(true)
  }

  const openEdit = (entry: FoodLogEntry) => {
    updateEntry.reset()
    editSheet.show(entry)
  }

  /** `when` ghi đè ngày giờ cho lần này ("Log to Date and Time"); không có thì dùng ngày giờ đang chọn ở bảng Thêm món. */
  const logPlate = async (
    items: PlateItem[] = plate,
    when?: { readonly date: string; readonly time: string }
  ) => {
    if (!date || items.length === 0) return false
    const targetDate = when?.date ?? logDate ?? date
    const targetTime = when?.time ?? eatenAt
    const targetMeal = when ? mealForTime(when.time) : meal
    setIsLoggingPlate(true)
    try {
      // Tuần tự: song song sẽ cùng tạo FoodLog của ngày và đụng unique (UserId, LogDate)
      for (const item of items) {
        if (item.recipeId) {
          // Recipe: chỉ gửi recipeId + số khẩu phần, gửi thêm foodServingId/foodItemId là BE trả 400
          await addEntry.mutateAsync({
            logDate: targetDate,
            mealType: targetMeal,
            eatenAt: `${targetTime}:00`,
            recipeId: item.recipeId,
            quantity: item.quantity,
          })
        } else if (item.foodItemId) {
          await addEntry.mutateAsync({
            logDate: targetDate,
            mealType: targetMeal,
            eatenAt: `${targetTime}:00`,
            foodItemId: item.foodItemId,
            foodServingId: item.foodServingId,
            quantity: item.quantity,
          })
        } else {
          // Ước lượng của AI không có món trong thư viện: log bằng Quick Add
          await quickAdd.mutateAsync({
            logDate: targetDate,
            mealType: targetMeal,
            eatenAt: `${targetTime}:00`,
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          })
        }
        setPlate((current) => current.filter((candidate) => candidate.key !== item.key))
      }
      toast.success(`Added ${items.length} ${items.length === 1 ? 'item' : 'items'}`)
      setAddOpen(false)
      return true
    } catch {
      // lỗi hiện inline trong sheet (addEntry.error); các món chưa log vẫn nằm trong plate để thử lại
      return false
    } finally {
      setIsLoggingPlate(false)
    }
  }

  /** "Log Foods" ở Food Detail: thêm món đang xem vào plate rồi ghi cả plate (món lỗi vẫn nằm trong plate để thử lại). */
  const logFromDetail = (item: PlateItem) => {
    setPlate((current) => [...current, item])
    setPickedId(null)
    void logPlate([...plate, item])
  }

  /** "To Custom": mở trang Create Food điền sẵn từ món này (sửa tuỳ ý rồi Create / Create & Add). */
  const copyToCustom = (food: FoodDetail) => {
    setAddOpen(false)
    router.push(`${routePath.foodNew}?from=${food.id}`)
  }

  /** Quick Add thêm vào plate (như món khác); ghi vào nhật ký khi bấm Log Foods (món không có foodItemId log bằng Quick Add). */
  const onQuickAdd = (values: QuickAddValues) =>
    setPlate((current) => [
      ...current,
      {
        key: `quick-${Date.now()}`,
        foodItemId: null,
        name: values.name ?? 'Quick add',
        foodServingId: null,
        servingLabel: 'Quick add',
        quantity: 1,
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
      },
    ])

  const onSaveEntry = (id: string, payload: UpdateEntryRequest) =>
    updateEntry.mutate({ id, payload }, { onSuccess: () => editSheet.hide() })

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
  // Kết quả AI đang xem (chưa log) cộng vào tổng ở thanh trên cùng, cập nhật theo mọi chỉnh sửa
  const aiPreviewItems =
    tab === 'ai' && aiPlate.dishes
      ? liveIngredients(aiPlate.dishes, aiPlate.states, aiPlate.edits).map((item) =>
          toPlateItem(item, item.ingredient.id)
        )
      : []
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
      onMore={() => moreSheet.show(true)}
    />
  )

  return (
    <div className="flex max-w-2xl flex-col gap-5 pb-24 md:pb-0">
      {header}

      <FormErrorAlert
        title="Couldn't delete"
        message={deleteError ? getFormErrorMessage(deleteError) : null}
      />

      {calendarMounted && date && (
        <CalendarSheet
          open={calendarOpen}
          onExited={() => setCalendarMounted(false)}
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
            key={date}
            entries={entries}
            firstHour={settings.hourRangeFirst}
            lastHour={settings.hourRangeLast}
            currentHour={date === today ? currentHour : null}
            showTimestamps={settings.showTimestamps}
            showHourlyTotals={settings.showHourlyTotals}
            alignRight={settings.alignment === 'Right'}
            longPressToAdd={settings.addFoodsToHour === 'LongPress'}
            tileSettings={
              hideDetails === 'hide'
                ? HIDDEN_DETAILS(timelineTileOptions(settings))
                : timelineTileOptions(settings)
            }
            hideEmptyHours={hideEmptyHours === 'hide'}
            onAddAt={openAdd}
            onSelectEntry={openEdit}
          />
          <NotesSection
            notes={toNotes(day.data.notes)}
            onAdd={() => {
              addNote.reset()
              noteSheet.show(null)
            }}
            onSelect={(note) => {
              updateNote.reset()
              noteSheet.show(note)
            }}
          />
        </>
      )}

      {!calendarOpen && (
        <DashboardSearchBar
          onSearch={() => openAdd()}
          onScan={() => {
            barcode.reset()
            setTab('scan')
            openAdd()
          }}
        />
      )}

      {moreSheet.value && date && (
        <MoreSheet
          key={moreSheet.id}
          open={moreSheet.open}
          onOpenChange={moreSheet.onOpenChange}
          hasEntries={entries.length > 0}
          hideFoodDetails={hideDetails === 'hide'}
          hideEmptyHours={hideEmptyHours === 'hide'}
          onHideFoodDetailsChange={(hide) => setHideDetails(hide ? 'hide' : 'show')}
          onHideEmptyHoursChange={(hide) => setHideEmptyHours(hide ? 'hide' : 'show')}
          onCopyDay={openCopy}
          onSelectAll={() => toast('Selecting foods is coming soon')}
          onClearDay={() => {
            clearDay.reset()
            setClearOpen(true)
          }}
        />
      )}

      {noteEditor !== undefined && date && (
        <NoteSheet
          key={noteSheet.id}
          open={noteSheet.open}
          onOpenChange={noteSheet.onOpenChange}
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
                  { onSuccess: () => noteSheet.hide() }
                )
              : addNote.mutate(
                  { logDate: date, text, notedAt },
                  { onSuccess: () => noteSheet.hide() }
                )
          }
          onDelete={(note) => deleteNote.mutate(note.id, { onSuccess: () => noteSheet.hide() })}
        />
      )}

      {barcodeSheet.value && (
        <BarcodeSheet
          key={barcodeSheet.id}
          open={barcodeSheet.open}
          onOpenChange={barcodeSheet.onOpenChange}
          isPending={barcode.isPending}
          error={barcode.error ? getFormErrorMessage(barcode.error) : null}
          onLookup={(code) =>
            lookupBarcode(code, () => {
              barcodeSheet.hide()
            })
          }
        />
      )}

      {dateTimeSheet.value && date && today && (
        <DateTimeSheet
          key={dateTimeSheet.id}
          open={dateTimeSheet.open}
          onOpenChange={dateTimeSheet.onOpenChange}
          today={today}
          date={logDate ?? date}
          time={eatenAt}
          canLog={plate.length > 0}
          isLogging={isLoggingPlate}
          onSelect={(nextDate, time) => {
            setLogDate(nextDate)
            setEatenAt(time)
            setMeal(mealForTime(time))
          }}
          onLog={(nextDate, time) => {
            dateTimeSheet.hide()
            void logPlate(plate, { date: nextDate, time })
          }}
        />
      )}

      <AddFoodDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tab={tab}
        onTabChange={setTab}
        meal={meal}
        logDate={logDate ?? date ?? ''}
        eatenAt={eatenAt}
        onTimeClick={() => dateTimeSheet.show(true)}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setTop(SEARCH_PAGE)
        }}
        detailOpen={tab === 'search' && Boolean(pickedId)}
        libraryFilter={{
          value: libraryFilter,
          placeholder: `Filter ${libraryView}`,
          onChange: (value) => {
            setLibraryFilter(value)
            setLibraryTop(SEARCH_PAGE)
          },
        }}
        plate={plate}
        previewItems={aiPreviewItems}
        totals={day.data?.totals}
        target={day.data?.target}
        settings={settings}
        isLogging={isLoggingPlate}
        error={
          addEntry.error
            ? getFormErrorMessage(addEntry.error)
            : quickAdd.error && tab !== 'quick'
              ? getFormErrorMessage(quickAdd.error)
              : null
        }
        onRemoveFromPlate={(key) =>
          setPlate((current) => current.filter((item) => item.key !== key))
        }
        onLogPlate={() => void logPlate()}
      >
        {tab === 'scan' ? (
          <ScanPanel
            active={addOpen && !barcodeSheet.open}
            isLookingUp={barcode.isPending}
            error={barcode.error ? getFormErrorMessage(barcode.error) : null}
            onCode={(code) => lookupBarcode(code)}
            onManual={() => {
              barcode.reset()
              barcodeSheet.show(true)
            }}
          />
        ) : tab === 'ai' ? (
          <AiPanel
            active={addOpen && tab === 'ai'}
            isAnalyzing={aiPlate.isAnalyzing}
            error={aiPlate.error ? getFormErrorMessage(aiPlate.error) : null}
            dishes={aiPlate.dishes}
            states={aiPlate.states}
            date={logDate ?? date ?? ''}
            edits={aiPlate.edits}
            tileOptions={loggerTileOptions(settings)}
            onSetGrams={aiPlate.setIngredientGrams}
            onRemoveIngredient={aiPlate.removeIngredient}
            onReplaceIngredient={aiPlate.replaceIngredient}
            onSetDishScale={aiPlate.setDishScale}
            dayTotals={day.data?.totals}
            target={day.data?.target}
            onAnalyze={aiPlate.analyze}
            onRetryIngredient={aiPlate.retryIngredient}
            onStartOver={aiPlate.reset}
            onLog={async (items, confirmations) => {
              // Ghi cả plate đang có + các nguyên liệu AI đã sửa; thành công mới báo BE món user chọn (lỗi confirm không chặn log)
              const logged = await logPlate([...plate, ...items])
              if (!logged) return
              aiPlate.confirm(confirmations)
              aiPlate.reset()
            }}
            onPreviewSample={
              process.env.NODE_ENV === 'development' ? aiPlate.previewSample : undefined
            }
          />
        ) : tab === 'library' ? (
          <LibraryPanel
            view={libraryView}
            onViewChange={(next) => {
              setLibraryView(next)
              setLibraryFilter('')
              setLibraryTop(SEARCH_PAGE)
            }}
            filter={libraryFilter}
            onClearFilter={() => setLibraryFilter('')}
            recipes={recipes.data?.items ? [...recipes.data.items] : []}
            recipesTotal={recipes.data?.totalCount ?? null}
            isRecipesLoading={recipes.isLoading}
            isRecipesFetching={recipes.isFetching}
            onLoadMoreRecipes={() => setLibraryTop((current) => current + SEARCH_PAGE)}
            foods={myFoods.data?.items ? [...myFoods.data.items] : []}
            foodsTotal={myFoods.data?.totalCount ?? null}
            isFoodsLoading={myFoods.isLoading}
            isFoodsFetching={myFoods.isFetching}
            onLoadMoreFoods={() => setLibraryTop((current) => current + SEARCH_PAGE)}
            favorites={favorites.data ?? []}
            isFavoritesLoading={favorites.isLoading}
            tileOptions={loggerTileOptions(settings)}
            createFoodHref={routePath.foodNew}
            createRecipeHref={routePath.recipeNew}
            onNavigate={() => setAddOpen(false)}
            onPickFood={(food) => {
              setPickedId(food.id)
              setTab('search')
            }}
            onAddToPlate={(item) => setPlate((current) => [...current, item])}
          />
        ) : tab === 'search' ? (
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
            favorites={favorites.data ?? []}
            isFavoritePending={addFavorite.isPending || removeFavorite.isPending}
            onAddFavorite={(foodItemId, foodServingId, quantity) =>
              addFavorite.mutate({ foodItemId, foodServingId, quantity })
            }
            onRemoveFavorite={(id) => removeFavorite.mutate(id)}
            tileOptions={loggerTileOptions(settings)}
            onAddToPlate={(item) => {
              setPlate((current) => [...current, item])
              setPickedId(null)
            }}
            detail={{
              targets: targetsByKey(foodNutrients.data?.items),
              isTargetsLoading: foodNutrients.isLoading,
              isLogging: isLoggingPlate,
              onLogFoods: logFromDetail,
              onCopyToCustom: copyToCustom,
              isCopyPending: false,
            }}
          />
        ) : (
          <QuickAddPanel onAdd={onQuickAdd} />
        )}
      </AddFoodDialog>

      <EntryEditDialog
        key={editSheet.id}
        entry={editing}
        open={editSheet.open}
        food={editingFood.data ?? undefined}
        isFoodLoading={editingFood.isLoading}
        isPending={updateEntry.isPending}
        error={updateEntry.error ? getFormErrorMessage(updateEntry.error) : null}
        totals={day.data?.totals}
        target={day.data?.target}
        banner={settings}
        today={date ?? ''}
        targets={targetsByKey(editingNutrients.data?.items)}
        isTargetsLoading={editingNutrients.isLoading}
        favorites={favorites.data ?? []}
        isFavoritePending={addFavorite.isPending || removeFavorite.isPending}
        onAddFavorite={(foodItemId, foodServingId, quantity) =>
          addFavorite.mutate({ foodItemId, foodServingId, quantity })
        }
        onRemoveFavorite={(id) => removeFavorite.mutate(id)}
        onCopyToCustom={(food) => {
          editSheet.hide()
          // Dòng không có món trong thư viện (Quick Add / AI / recipe): điền sẵn tên và macro của dòng thay vì mở theo id món
          if (editing && editing.foodItemId === null) {
            const query = new URLSearchParams({
              name: editing.foodName,
              calories: String(editing.calories),
              protein: String(editing.protein),
              carbs: String(editing.carbs),
              fat: String(editing.fat),
            })
            router.push(`${routePath.foodNew}?${query.toString()}`)
          } else router.push(`${routePath.foodNew}?from=${food.id}`)
        }}
        onOpenChange={editSheet.onOpenChange}
        onSave={onSaveEntry}
        onRequestDelete={(entry) => {
          // Xoá luôn không hỏi: đóng màn sửa (trượt xuống) và món co lại trên timeline
          deleteEntry.reset()
          editSheet.hide()
          deleteEntry.mutate(entry.id)
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
