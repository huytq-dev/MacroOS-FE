'use client'

import { useState } from 'react'
import { ChartPie, Pencil, Plus, Utensils } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Energy, EnergyUnit } from '@/components/shared/Energy'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useSheet } from '@/hooks/use-sheet'
import { formatMonthYear, todayIso } from '@/lib/date'
import { formatWeekdayMonthDay } from '@/lib/week'
import { NutritionDaySheet } from '../components/NutritionDaySheet'
import {
  useDeleteNutritionDay,
  useNutritionDays,
  useSaveNutritionDay,
} from '../hooks/use-nutrition-data'
import type { NutritionDay } from '../types/nutrition-data.types'

/**
 * Nutrition Data Manager (như MacroFactor): tiêu đề với nút + (thêm ngày), các ngày có dữ liệu nhóm theo tháng (mới trước); mỗi
 * dòng là biểu tượng nguồn, kcal, biểu tượng "incomplete" nếu ngày chưa đủ, ngày và nút bút chì mở sheet sửa. Sheet cho nhập
 * kcal / macro, nhịn ăn, ngày chưa đủ; thùng rác xoá dữ liệu nhập tay của ngày.
 */
export function NutritionDataPage() {
  const query = useNutritionDays()
  const save = useSaveNutritionDay()
  const remove = useDeleteNutritionDay()
  const sheet = useSheet<true>()
  const confirm = useSheet<true>()
  const [target, setTarget] = useState({ date: '', today: '' })

  const days = query.data ?? []
  const months = new Map<string, NutritionDay[]>()
  for (const day of days) {
    const key = day.date.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), day])
  }
  const existing = days.find((day) => day.date === target.date)

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
      ) : query.isError ? (
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
        [...months.entries()].map(([key, items], index) => (
          <section
            key={key}
            aria-labelledby={`nutrition-${key}`}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-400 space-y-3 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <h2 id={`nutrition-${key}`} className="text-xl font-bold">
              {formatMonthYear(key)}
            </h2>
            <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
              {items.map((day) => (
                <li key={day.date} className="flex items-center gap-3 py-1.5 pr-2 pl-3">
                  <span
                    aria-hidden="true"
                    title={day.source}
                    className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-md"
                  >
                    <Utensils className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-base tabular-nums">
                    <Energy kcal={day.calories} /> <EnergyUnit />
                    {day.isFasting && <span className="text-muted-foreground"> · Fasting</span>}
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
              ))}
            </ul>
          </section>
        ))
      )}

      {sheet.value && (
        <NutritionDaySheet
          key={`${sheet.id}-${target.date}`}
          open={sheet.open}
          onOpenChange={sheet.onOpenChange}
          date={target.date}
          today={target.today}
          onDateChange={(date) => setTarget((previous) => ({ ...previous, date }))}
          existing={existing}
          onDelete={() => {
            remove.reset()
            confirm.show(true)
          }}
          isPending={save.isPending}
          error={save.error ? getFormErrorMessage(save.error) : null}
          onSave={(payload) => save.mutate(payload, { onSuccess: () => sheet.hide() })}
        />
      )}
      {confirm.value && (
        <ConfirmDialog
          key={confirm.id}
          open={confirm.open}
          onOpenChange={confirm.onOpenChange}
          title="Delete this day's nutrition?"
          description="The calories, macros and flags you entered for this day will be deleted. Foods logged in the Food Log are kept."
          confirmLabel="Delete"
          pendingLabel="Deleting..."
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate(target.date, {
              onSuccess: () => {
                confirm.hide()
                sheet.hide()
              },
            })
          }
        />
      )}
    </div>
  )
}
