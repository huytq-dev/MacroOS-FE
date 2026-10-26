'use client'

import { useState } from 'react'
import { ChartPie, Coffee, Loader2, Pencil, PenLine, Plus, Utensils } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Energy, EnergyUnit } from '@/components/shared/Energy'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useSheet } from '@/hooks/use-sheet'
import { formatDate, formatMonthYear, todayIso } from '@/lib/date'
import { formatWeekdayMonthDay } from '@/lib/week'
import { NutritionDaySheet } from '../components/NutritionDaySheet'
import {
  DELETE_NUTRITION_TITLE,
  REMOVE_OVERRIDE_TITLE,
  deleteNutritionDescription,
  isNoChange,
  ndmErrorMessage,
  notUsedForExpenditure,
  removeOverrideDescription,
  sourceSrText,
} from '../nutrition-data.utils'
import {
  useDeleteNutritionDay,
  useNutritionDayLookup,
  useNutritionDays,
  useRemoveManualOverride,
  useSaveNutritionDay,
} from '../hooks/use-nutrition-data'
import type { NutritionDay } from '../types/nutrition-data.types'

const SOURCE_ICON = { Manual: PenLine, FoodLog: Utensils, Fasting: Coffee } as const

/**
 * Nutrition Data Manager (như MacroFactor): tiêu đề với nút + (thêm ngày), các ngày có dữ liệu nhóm theo tháng (mới trước, theo trang 90 ngày + "Load earlier");
 * mỗi dòng là biểu tượng nguồn (Food Log / nhập tay / nhịn ăn, do BE quyết), kcal HIỆU LỰC ("—" khi chưa biết), "Not used for Expenditure" khi BE báo ngày không
 * được thuật toán dùng, biểu tượng "incomplete", ngày và nút bút chì mở sheet sửa. Sheet cho nhập kcal / macro, nhịn ăn, ngày chưa đủ, gỡ số nhập tay; thùng rác xoá dữ liệu NDM.
 */
export function NutritionDataPage() {
  const query = useNutritionDays()
  const save = useSaveNutritionDay()
  const remove = useDeleteNutritionDay()
  const removeOverride = useRemoveManualOverride()
  const sheet = useSheet<true>()
  const confirm = useSheet<true>()
  const confirmOverride = useSheet<true>()
  const [target, setTarget] = useState({ date: '', today: '' })

  const days = query.data ?? []
  const months = new Map<string, NutritionDay[]>()
  for (const day of days) {
    const key = day.date.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), day])
  }
  // Ngày cũ hơn mọi trang đã tải mà BE còn trang cũ hơn: hỏi riêng ngày đó (không thì ngày có số nhập tay trông như ngày trống)
  const oldest = days.at(-1)?.date
  const needsLookup =
    query.hasNextPage && oldest !== undefined && target.date !== '' && target.date < oldest
  const lookup = useNutritionDayLookup(target.date, Boolean(needsLookup))
  const existing = days.find((day) => day.date === target.date) ?? lookup.data
  const loadingExisting = Boolean(needsLookup) && lookup.isPending

  const open = (date?: string) => {
    const today = todayIso()
    setTarget({ date: date ?? today, today })
    save.reset()
    sheet.show(true)
  }

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 pb-8">
      <SubPageHeader
        title="Nutrition Data Manager"
        action={
          <IconButton
            icon={Plus}
            label="Add nutrition data"
            className="size-11"
            onClick={() => open()}
          />
        }
      />

      {query.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : query.isError && days.length === 0 ? (
        <ErrorState
          error={query.error}
          variant="inline"
          onRetry={() => void query.refetch()}
          isRetrying={query.isRefetching}
        />
      ) : months.size === 0 ? (
        <div className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Utensils aria-hidden="true" className="size-10" />
          <p className="text-foreground text-lg font-medium">No nutrition data yet</p>
          <p className="text-base">Tap + to add calories and macros for a day.</p>
        </div>
      ) : (
        <>
          {[...months.entries()].map(([key, items], index) => (
            <section
              key={key}
              aria-labelledby={`nutrition-${key}`}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-400 space-y-3 [animation-fill-mode:backwards]"
              style={{ animationDelay: `${Math.min(index, 4) * 70}ms` }}
            >
              <h2 id={`nutrition-${key}`} className="text-xl font-bold">
                {formatMonthYear(key)}
              </h2>
              <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
                {items.map((day) => {
                  const Icon = SOURCE_ICON[day.source]
                  return (
                    <li key={day.date} className="flex items-center gap-3 py-1.5 pr-2 pl-3">
                      <span
                        aria-hidden="true"
                        className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-md"
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-base tabular-nums">
                        <Energy kcal={day.calories} /> <EnergyUnit />
                        {day.isFasting && <span className="text-muted-foreground"> · Fasting</span>}
                        {/* Nguồn của số (icon không có chữ, `title` không có trên màn cảm ứng): đọc được bằng trình đọc màn hình */}
                        <span className="sr-only">{sourceSrText(day)}</span>
                        {notUsedForExpenditure(day) && (
                          <span className="text-muted-foreground block text-sm leading-tight">
                            Not used for Expenditure
                          </span>
                        )}
                      </span>
                      {day.isIncomplete && (
                        <ChartPie
                          aria-label="Incomplete day"
                          role="img"
                          className="text-muted-foreground size-5 shrink-0"
                        />
                      )}
                      <span className="text-muted-foreground shrink-0 text-base tabular-nums">
                        {formatWeekdayMonthDay(day.date)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Edit nutrition for ${formatWeekdayMonthDay(day.date)}`}
                        onClick={() => open(day.date)}
                        className="focus-visible:ring-ring/50 group flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
                      >
                        <span className="bg-secondary group-active:bg-foreground/20 flex size-8 items-center justify-center rounded-full transition-[background-color,transform] duration-100 group-active:scale-90 motion-reduce:group-active:scale-100">
                          <Pencil aria-hidden="true" className="size-4" />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          {/* 90 ngày là kích thước trang, không phải giới hạn lịch sử: còn ngày cũ hơn thì lấy tiếp theo con trỏ của BE */}
          {query.hasNextPage && (
            <div className="flex flex-col items-center gap-2">
              {query.isFetchNextPageError && (
                <p role="alert" className="text-muted-foreground text-sm">
                  Couldn&apos;t load earlier days.
                </p>
              )}
              <Button
                variant="secondary"
                className="h-11 rounded-full px-5 text-base"
                disabled={query.isFetchingNextPage}
                aria-busy={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage && (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                )}
                {query.isFetchingNextPage
                  ? 'Loading…'
                  : query.isFetchNextPageError
                    ? 'Try again'
                    : 'Load earlier'}
              </Button>
            </div>
          )}
        </>
      )}

      {sheet.value && (
        <NutritionDaySheet
          key={`${sheet.id}-${target.date}-${loadingExisting}`}
          open={sheet.open}
          onOpenChange={sheet.onOpenChange}
          date={target.date}
          today={target.today}
          onDateChange={(date) => setTarget((previous) => ({ ...previous, date }))}
          existing={existing}
          loadingExisting={loadingExisting}
          onDelete={() => {
            remove.reset()
            confirm.show(true)
          }}
          onRemoveOverride={() => {
            removeOverride.reset()
            confirmOverride.show(true)
          }}
          isPending={save.isPending}
          error={save.error ? ndmErrorMessage(save.error, getFormErrorMessage) : null}
          onSave={(payload) => {
            // Không đổi gì: đóng bảng, không gửi và không báo "saved" (thành công giả)
            if (isNoChange(payload, existing)) {
              sheet.hide()
              return
            }
            save.mutate({ payload, existing }, { onSuccess: () => sheet.hide() })
          }}
        />
      )}
      {confirm.value && (
        <ConfirmDialog
          key={confirm.id}
          open={confirm.open}
          onOpenChange={confirm.onOpenChange}
          title={DELETE_NUTRITION_TITLE}
          description={deleteNutritionDescription(existing, formatDate(target.date))}
          confirmLabel="Delete"
          pendingLabel="Deleting..."
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate(target.date, {
              onSuccess: () => {
                confirm.hide()
                sheet.hide()
              },
              onError: () => confirm.hide(),
            })
          }
        />
      )}
      {confirmOverride.value && (
        <ConfirmDialog
          key={confirmOverride.id}
          open={confirmOverride.open}
          onOpenChange={confirmOverride.onOpenChange}
          title={REMOVE_OVERRIDE_TITLE}
          description={removeOverrideDescription(
            formatDate(target.date),
            (existing?.entryCount ?? 0) > 0
          )}
          confirmLabel="Remove"
          pendingLabel="Removing..."
          isPending={removeOverride.isPending}
          onConfirm={() =>
            removeOverride.mutate(target.date, {
              onSuccess: () => {
                confirmOverride.hide()
                sheet.hide()
              },
              onError: () => confirmOverride.hide(),
            })
          }
        />
      )}
    </div>
  )
}
