'use client'

import Link from 'next/link'
import { Camera, ChevronRight } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { TAPE_GROUPS } from '@/features/shortcuts/full-body.config'
import { useFullBodyHistory } from '@/features/shortcuts/hooks/use-body-metrics'
import { useProgressPhotoSessions } from '@/features/progress-photos/hooks/use-progress-photos'
import { photoOf } from '@/features/progress-photos/progress-photos.utils'
import { useProfile } from '@/features/users/hooks/use-profile'
import { formatDate } from '@/lib/date'
import { useMeasurementOverview } from '../../hooks/use-measurement-overview'
import { MetricTile } from './MetricTile'
import { Sparkline } from './TileVisuals'

/** Khoá ô trên Dashboard → khoá số đo của BE (Bicep = cánh tay). */
const TILE_KEY: Record<string, string> = {
  neck: 'neck',
  shoulders: 'shoulders',
  bust: 'bust',
  chest: 'chest',
  waist: 'waist',
  hips: 'hips',
  bicepL: 'leftBicep',
  bicepR: 'rightBicep',
  forearmL: 'leftForearm',
  forearmR: 'rightForearm',
  wristL: 'leftWrist',
  wristR: 'rightWrist',
  thighL: 'leftThigh',
  thighR: 'rightThigh',
  calfL: 'leftCalf',
  calfR: 'rightCalf',
  ankleL: 'leftAnkle',
  ankleR: 'rightAnkle',
}

/** Một giá trị thì vẽ đoạn phẳng hai đầu chấm rỗng như MacroFactor (một điểm chỉ ra một chấm). */
export const sparkOf = (values: readonly number[]) =>
  values.length === 1 ? [values[0], values[0]] : values

const trim = (value: number) => String(Number(value.toFixed(1)))

/**
 * Ô số đo cơ thể (Neck, Shoulders…) đã bật trong Customize: luôn hiện như MacroFactor; chưa đo lần nào thì "--- cm" và không có đường.
 * Có dữ liệu thì "Last 7 Entries", đường xu hướng và giá trị mới nhất.
 */
export function MeasureTile({
  tileKey,
  title,
}: {
  readonly tileKey: string
  readonly title: string
}) {
  const overview = useMeasurementOverview()
  const key = TILE_KEY[tileKey]
  const metric = key ? overview.data?.metrics.find((item) => item.key === key) : undefined
  // BE trả mới → cũ; đường xu hướng đi cũ → mới
  const values = metric?.entries.map((entry) => entry.valueCm).reverse() ?? []
  return (
    <MetricTile
      title={title}
      subtitle="Last 7 Entries"
      href={key ? routePath.bodyMeasurement(key) : undefined}
      visual={
        values.length > 0 ? (
          <Sparkline values={sparkOf(values)} className="text-mf-tile-carbs" />
        ) : undefined
      }
      value={metric && values.length > 0 ? trim(metric.latestCm) : '---'}
      unit={key ? 'cm' : ''}
    />
  )
}

/**
 * Ô tỉ lệ cơ thể (Waist to Height = vòng eo ÷ chiều cao trong hồ sơ, Waist to Hip = vòng eo ÷ vòng hông), 2 chữ số thập phân, không đơn vị.
 * Tính từ cùng 7 lần đo gần nhất của các ô số đo; thiếu số đo hoặc chiều cao thì "---" và không có đường. Chạm mở trang vòng eo.
 */
export function RatioTile({
  tileKey,
  title,
}: {
  readonly tileKey: 'waistToHeight' | 'waistToHip'
  readonly title: string
}) {
  const overview = useMeasurementOverview()
  const profile = useProfile()
  const metrics = overview.data?.metrics
  const waist = metrics?.find((item) => item.key === 'waist')
  const hips = metrics?.find((item) => item.key === 'hips')
  const heightCm = profile.data?.heightCm ?? null
  // Mới → cũ như BE; mỗi điểm là tỉ lệ của một lần đo vòng eo (Waist to Hip chỉ tính ngày có cả hông)
  const ratios = (waist?.entries ?? []).flatMap((entry) => {
    const divisor =
      tileKey === 'waistToHeight'
        ? heightCm
        : (hips?.entries.find((item) => item.date === entry.date)?.valueCm ?? null)
    return divisor ? [entry.valueCm / divisor] : []
  })
  const latestDivisor = tileKey === 'waistToHeight' ? heightCm : (hips?.latestCm ?? null)
  const latest = waist && latestDivisor ? waist.latestCm / latestDivisor : null
  const spark = [...ratios].reverse()
  return (
    <MetricTile
      title={title}
      subtitle="Last 7 Entries"
      href={routePath.bodyMeasurement('waist')}
      visual={
        spark.length > 0 ? (
          <Sparkline values={sparkOf(spark)} className="text-mf-tile-carbs" />
        ) : undefined
      }
      value={latest === null ? '---' : latest.toFixed(2)}
    />
  )
}

/**
 * Ô Progress Photos: ảnh Front mới nhất tràn cả thẻ, lớp mờ dần ở đáy, ngày chụp và mũi tên; chạm mở trang Progress Photos. Chưa có ảnh
 * thì là thẻ thường mời thêm ảnh.
 */
export function ProgressPhotosTile() {
  const query = useProgressPhotoSessions()
  const sessions = query.data?.sessions ?? []
  const session = sessions.find((item) => photoOf(item, 'Front')) ?? sessions[0]
  const photo = photoOf(session, 'Front') ?? session?.photos[0]
  if (!session || !photo)
    return (
      <MetricTile
        title="Progress Photos"
        subtitle={query.isPending ? 'Loading…' : 'No photos yet'}
        visual={<Camera aria-hidden="true" className="text-muted-foreground size-8" />}
        value="Add"
        href={routePath.progressPhotos}
      />
    )
  return (
    <Link
      href={routePath.progressPhotos}
      aria-label={`Progress Photos, latest ${formatDate(session.date)}`}
      className="bg-card focus-visible:ring-ring/50 relative flex min-h-44 min-w-0 overflow-hidden rounded-2xl transition-transform duration-200 focus-visible:ring-1 focus-visible:outline-none motion-safe:active:scale-[0.98]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn, next/image không tối ưu được */}
      <img
        src={photo.url}
        alt=""
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500 absolute inset-0 size-full object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent"
      />
      <span className="relative mt-auto flex w-full items-center justify-between gap-2 p-4 text-white">
        <span className="min-w-0 truncate text-lg tabular-nums">{formatDate(session.date)}</span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
      </span>
    </Link>
  )
}

/**
 * Ô Full Body: ngày mới nhất có số đo, thanh trượt ngang các chip chỉ số (vạch xanh bên trái, giá trị đậm, tên bên dưới; cuộn bắt
 * điểm, mờ ở mép, từng chip hiện lần lượt) và "N metrics" ở đáy. Chạm cả thẻ mở Full Body.
 */
export function FullBodyTile() {
  const history = useFullBodyHistory()
  const latest = history.data?.[0]
  const chips = latest
    ? [
        ...TAPE_GROUPS.flatMap((group) => group.fields).flatMap((f) => {
          const value = latest.tape?.[f.key]
          return value === null || value === undefined
            ? []
            : [{ key: f.key, label: f.label, text: `${trim(value)} cm` }]
        }),
        ...(latest.visualBodyFatPercent === null
          ? []
          : [
              {
                key: 'visualBodyFat',
                label: 'Visual Body Fat',
                text: `${latest.visualBodyFatPercent.toFixed(1)}%`,
              },
            ]),
      ]
    : []
  if (!latest || chips.length === 0)
    return (
      <MetricTile
        title="Full Body"
        subtitle={history.isPending ? 'Loading…' : 'No entries yet'}
        value="---"
        unit="metrics"
        href={routePath.fullBody}
      />
    )
  return (
    <Link
      href={routePath.fullBody}
      className="bg-card active:bg-muted focus-visible:ring-ring/50 flex min-w-0 flex-col gap-3 rounded-2xl p-4 transition-colors focus-visible:ring-1 focus-visible:outline-none motion-safe:active:scale-[0.99]"
    >
      <div className="min-w-0">
        <h3 className="text-lg leading-tight font-medium">Full Body</h3>
        <p className="text-muted-foreground truncate text-base">{formatDate(latest.date)}</p>
      </div>
      <ul
        aria-label="Latest metrics"
        className="-mr-4 flex min-h-12 flex-1 snap-x snap-mandatory [scrollbar-width:none] items-center gap-4 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] pr-8 [&::-webkit-scrollbar]:hidden"
      >
        {chips.map((chip, index) => (
          <li
            key={chip.key}
            className="border-mf-tile-carbs motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-3 motion-safe:animation-duration-400 shrink-0 snap-start border-l-[3px] pl-2 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <p className="text-lg leading-tight font-semibold whitespace-nowrap tabular-nums">
              {chip.text}
            </p>
            <p className="text-muted-foreground text-base leading-tight whitespace-nowrap">
              {chip.label}
            </p>
          </li>
        ))}
      </ul>
      <div className="border-border/70 flex items-center justify-between border-t pt-3">
        <p className="text-xl tabular-nums">
          {chips.length} {chips.length === 1 ? 'metric' : 'metrics'}
        </p>
        <ChevronRight aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
      </div>
    </Link>
  )
}
