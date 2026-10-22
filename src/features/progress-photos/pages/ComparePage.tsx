'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { ChoiceSheet } from '@/components/shared/ChoiceSheet'
import { Skeleton } from '@/components/ui/skeleton'
import { SlidingSwitch } from '@/features/food-log/components/FoodLogPage/SlidingSwitch'
import { useUnits } from '@/features/users/hooks/use-units'
import { useSheet } from '@/hooks/use-sheet'
import { formatDate } from '@/lib/date'
import { useProgressPhotoSessions } from '../hooks/use-progress-photos'
import { ANGLES, kgLabel, photoOf } from '../progress-photos.utils'
import type { PhotoAngle, PhotoSession } from '../types/progress-photos.types'

const ANGLE_OPTIONS = ANGLES.map((angle) => ({ value: angle, label: angle }))
const MODES = [
  { value: 'side', label: 'Side by side' },
  { value: 'slider', label: 'Slider' },
] as const
type Mode = (typeof MODES)[number]['value']
type Slot = 'before' | 'after'

/** Một ảnh của so sánh kèm ngày và cân nặng của ngày đó. */
function ComparePhoto({
  label,
  session,
  angle,
}: {
  readonly label: string
  readonly session: PhotoSession | undefined
  readonly angle: PhotoAngle
}) {
  const photo = photoOf(session, angle)
  const { weight } = useUnits()
  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className="text-center">
        <span className="text-muted-foreground block text-sm">{label}</span>
        <span className="block text-base font-medium">
          {session ? formatDate(session.date) : '—'}
        </span>
      </figcaption>
      <div className="bg-card relative aspect-square overflow-hidden rounded-2xl">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn, next/image không tối ưu được
          <img
            key={photo.id}
            src={photo.url}
            alt={`${label} ${angle.toLowerCase()} photo`}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-300 size-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground absolute inset-0 flex items-center justify-center px-3 text-center text-sm">
            No {angle.toLowerCase()} photo
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-center text-sm tabular-nums">
        {kgLabel(session?.trendWeightKg ?? null, weight)} trend ·{' '}
        {kgLabel(session?.scaleWeightKg ?? null, weight)} scale
      </p>
    </figure>
  )
}

/** So sánh trượt: ảnh Before nằm trên After, kéo thanh để lộ dần; `<input type=range>` trong suốt lo bàn phím và trình đọc màn hình. */
function SliderCompare({
  before,
  after,
  angle,
}: {
  readonly before: PhotoSession | undefined
  readonly after: PhotoSession | undefined
  readonly angle: PhotoAngle
}) {
  const [split, setSplit] = useState(50)
  const beforePhoto = photoOf(before, angle)
  const afterPhoto = photoOf(after, angle)
  return (
    <div className="space-y-3">
      <div className="bg-card relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl select-none">
        {afterPhoto && (
          // eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn, next/image không tối ưu được
          <img
            src={afterPhoto.url}
            alt="After"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {beforePhoto && (
          // eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn, next/image không tối ưu được
          <img
            src={beforePhoto.url}
            alt="Before"
            style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <span
          aria-hidden="true"
          style={{ left: `${split}%` }}
          className="bg-foreground absolute inset-y-0 w-0.5 -translate-x-1/2"
        >
          <span className="bg-foreground text-background absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm">
            ↔
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          aria-label="Before and after position"
          onChange={(event) => setSplit(Number(event.target.value))}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
      <div className="flex justify-between text-base">
        <span>{before ? formatDate(before.date) : '—'}</span>
        <span>{after ? formatDate(after.date) : '—'}</span>
      </div>
    </div>
  )
}

/**
 * Compare Before & After: chọn hai ngày (mặc định ngày đầu và ngày mới nhất có ảnh) và một góc; xem cạnh nhau (kèm cân nặng từng ngày)
 * hoặc dạng thanh trượt phủ lên nhau.
 */
export function ComparePage() {
  const router = useRouter()
  const { weight } = useUnits()
  const query = useProgressPhotoSessions()
  const pick = useSheet<Slot>()
  const [angle, setAngle] = useState<PhotoAngle>('Front')
  const [mode, setMode] = useState<Mode>('side')
  const [chosen, setChosen] = useState<Partial<Record<Slot, string>>>({})

  const sessions = query.data?.sessions ?? []
  // Cũ → mới, chỉ các ngày có ảnh của góc đang so sánh
  const timeline = sessions.filter((session) => photoOf(session, angle)).reverse()
  const find = (date: string | undefined) => timeline.find((session) => session.date === date)
  const before = find(chosen.before) ?? timeline[0]
  const after = find(chosen.after) ?? timeline.at(-1)

  const choices = timeline.map((session) => ({
    value: session.date,
    label: formatDate(session.date),
    description:
      session.scaleWeightKg === null ? undefined : kgLabel(session.scaleWeightKg, weight),
  }))

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-medium">Compare Before &amp; After</h1>
        <span className="size-11 shrink-0" aria-hidden="true" />
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-4 pb-8">
        <div className="flex justify-center">
          <SlidingSwitch
            options={ANGLE_OPTIONS}
            value={angle}
            onChange={setAngle}
            label="Photo angle"
            className="bg-card"
          />
        </div>

        {query.isPending ? (
          <div className="grid grid-cols-2 gap-3" aria-busy="true">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="aspect-square rounded-2xl" />
          </div>
        ) : timeline.length < 2 ? (
          <p className="bg-card text-muted-foreground rounded-xl px-4 py-6 text-center text-base">
            Add {angle.toLowerCase()} photos on two different days to compare them.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(['before', 'after'] as const).map((slot) => {
                const session = slot === 'before' ? before : after
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => pick.show(slot)}
                    className="bg-card focus-visible:ring-ring/50 active:bg-muted flex min-h-12 items-center justify-between gap-2 rounded-xl px-4 text-base transition-[background-color,transform] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-[0.98] motion-reduce:active:scale-100"
                  >
                    <span className="min-w-0 text-left">
                      <span className="text-muted-foreground block text-xs capitalize">{slot}</span>
                      <span className="block truncate">
                        {session ? formatDate(session.date) : '—'}
                      </span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="text-muted-foreground size-5 shrink-0"
                    />
                  </button>
                )
              })}
            </div>

            <div className="flex justify-center">
              <SlidingSwitch
                options={MODES}
                value={mode}
                onChange={setMode}
                label="Compare layout"
                className="bg-card"
              />
            </div>

            <div
              key={mode}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300"
            >
              {mode === 'side' ? (
                <div className="grid grid-cols-2 gap-3">
                  <ComparePhoto label="Before" session={before} angle={angle} />
                  <ComparePhoto label="After" session={after} angle={angle} />
                </div>
              ) : (
                <SliderCompare before={before} after={after} angle={angle} />
              )}
            </div>
          </>
        )}
      </div>

      {pick.value && (
        <ChoiceSheet
          key={pick.id}
          open={pick.open}
          onOpenChange={pick.onOpenChange}
          title={pick.value === 'before' ? 'Before' : 'After'}
          subtitle={`${angle} photos`}
          choices={choices}
          value={(pick.value === 'before' ? before : after)?.date ?? ''}
          onSelect={(date) => {
            const slot = pick.value
            if (slot) setChosen((current) => ({ ...current, [slot]: date }))
          }}
        />
      )}
    </div>
  )
}
