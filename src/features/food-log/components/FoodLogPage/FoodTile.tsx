'use client'

import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import { FoodIcon } from '@/components/shared/FoodIcon'
import type { TileOptions } from '../../food-log-settings'
import { HighlightedText } from '@/lib/search-highlight'
import { cn } from '@/lib/utils'

export interface FoodTileData {
  readonly name: string
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
  /** "1 cup" hoặc "140 g" khi log theo gram; null = không có. */
  readonly servingText: string | null
  /** "140 g" (tổng khối lượng); null = chưa biết. */
  readonly weightText: string | null
  readonly emoji: string | null
  /** Khoá icon trong bộ icon món ăn; có thì hiện ảnh thay emoji. */
  readonly iconKey?: string | null
  /** Từ khoá tìm kiếm: phần khớp trong tên được in đậm (chỉ kết quả tìm kiếm). */
  readonly highlight?: string
}

export type FoodTileSettings = TileOptions

interface FoodTileProps {
  readonly food: FoodTileData
  readonly settings: FoodTileSettings
  /** card = thẻ có nền (timeline); row = dòng phẳng ngăn bằng đường kẻ (kết quả tìm kiếm). */
  readonly variant?: 'card' | 'row'
  /** Bấm cả ô để chọn/sửa món; không truyền thì ô chỉ để xem (preview ở cài đặt). */
  readonly onSelect?: () => void
  /** Nút + (Multi-Add) mở chi tiết món (như bấm cả dòng) để chọn khẩu phần rồi Add vào plate; chỉ dùng khi highlight = MultiAdd. */
  readonly onAdd?: () => void
}

const DENSITY = {
  // icon: cạnh icon món (px)
  Comfort: { padding: 'px-4 py-4', icon: 44, name: 'text-[17px]', gap: 'gap-4' },
  Standard: { padding: 'px-4 py-3', icon: 36, name: 'text-base', gap: 'gap-3' },
  Compact: { padding: 'px-3 py-2', icon: 28, name: 'text-[15px]', gap: 'gap-3' },
} as const

const NAME_CLAMP = {
  Comfort: '',
  Standard: 'line-clamp-2',
  Compact: 'truncate',
} as const

/** Hiện dần khi một phần của ô được bật (tắt thì biến mất ngay, chiều cao ô co lại có hoạt ảnh). */
const FADE_IN = 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300'

/** Bút chì đặc (như MacroFactor): đầu bút chỉ xuống góc trái dưới, nét đầy, không viền. */
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />
    </svg>
  )
}

/** Dấu + đặc dùng cho nút Multi-Add. */
function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-5"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

/** Ghép khẩu phần và khối lượng theo cờ hiển thị: "1 cup (140 g)", "1 cup", "140 g" hoặc rỗng. */
function detailOf(food: FoodTileData, showServing: boolean, showWeight: boolean) {
  const serving = showServing ? food.servingText : null
  const weight = showWeight ? food.weightText : null
  if (serving && weight && serving !== weight) return `${serving} (${weight})`
  return serving ?? weight
}

/**
 * Giữ chiều cao bằng đúng nội dung và chạy hoạt ảnh (300ms) mỗi khi nội dung đổi cao (đổi mật độ, bật/tắt macro, khẩu phần,
 * khối lượng). Lần đo đầu không có hoạt ảnh vì chiều cao ban đầu là tự động.
 */
function AnimatedHeight({
  className,
  children,
}: {
  readonly className?: string
  readonly children: React.ReactNode
}) {
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const element = inner.current
    if (!element) return
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      style={{ height }}
      className={cn(
        'overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none',
        className
      )}
    >
      <div ref={inner}>{children}</div>
    </div>
  )
}

/**
 * Ô món (Timeline Food Tiles và Logger Food Tiles): emoji, tên, dòng "kcal · P · F · C" và khẩu phần/khối lượng. Comfort để tên
 * xuống dòng và khẩu phần ở dòng riêng; Standard cho tên tối đa hai dòng và gộp khẩu phần vào dòng macro; Compact một dòng tên.
 * Điểm nhấn bên phải: Edit (nút bút chì tròn), MultiAdd (nút + riêng, mở chi tiết món để chọn khẩu phần rồi Add vào plate), Energy (số kcal ở góc phải trên, bỏ kcal khỏi dòng macro), None (tên dài hơn).
 * Đổi cài đặt thì ô co giãn có hoạt ảnh.
 */
export function FoodTile({ food, settings, variant = 'card', onSelect, onAdd }: FoodTileProps) {
  const density = DENSITY[settings.density]
  const highlight = settings.highlight
  const showKcalInline = highlight !== 'Energy'
  const detail = detailOf(food, settings.showServing, settings.showWeight)
  const hasStats = showKcalInline || settings.showMacros
  const comfort = settings.density === 'Comfort'
  const kcal = Math.round(food.calories)

  const main = (
    <>
      <FoodIcon
        iconKey={food.iconKey}
        emoji={food.emoji}
        size={density.icon}
        className="transition-[width,height,font-size] duration-300"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span
            className={cn(
              'block min-w-0 flex-1 leading-snug font-normal transition-[font-size] duration-300',
              density.name,
              NAME_CLAMP[settings.density]
            )}
          >
            <HighlightedText text={food.name} query={food.highlight} />
          </span>
          {highlight === 'Energy' && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center leading-snug font-normal tabular-nums',
                density.name,
                FADE_IN
              )}
            >
              {kcal}
              <Flame aria-hidden="true" fill="currentColor" className="size-3.5" />
            </span>
          )}
        </span>
        <span className="text-muted-foreground flex items-center gap-x-2 text-[13px] font-light">
          {hasStats && (
            <span className="inline-flex items-center gap-2 whitespace-nowrap tabular-nums">
              {showKcalInline && (
                <span className={cn('inline-flex items-center', FADE_IN)}>
                  {kcal}
                  <Flame aria-hidden="true" fill="currentColor" className="size-3.5" />
                </span>
              )}
              {settings.showMacros && (
                <span className={cn('inline-flex gap-2', FADE_IN)}>
                  <span>{Math.round(food.protein)}P</span>
                  <span>{Math.round(food.fat)}F</span>
                  <span>{Math.round(food.carbs)}C</span>
                </span>
              )}
            </span>
          )}
          {!comfort && hasStats && detail && <span aria-hidden="true">•</span>}
          {!comfort && detail && <span className={cn('truncate', FADE_IN)}>{detail}</span>}
        </span>
        {comfort && detail && (
          <span className={cn('text-muted-foreground block text-[13px]', FADE_IN)}>{detail}</span>
        )}
      </span>
    </>
  )
  const editBadge = highlight === 'Edit' && (
    <span
      aria-hidden="true"
      className={cn(
        'bg-foreground/15 flex size-11 shrink-0 items-center justify-center rounded-full',
        FADE_IN
      )}
    >
      <PencilIcon />
    </span>
  )
  const plusButton = highlight === 'MultiAdd' && (
    <button
      type="button"
      aria-label={`Add ${food.name}`}
      onClick={onAdd}
      disabled={!onAdd}
      className={cn(
        // Nút gọn 36px (như MF) nhưng vùng chạm vẫn 44px nhờ before
        'bg-foreground/15 active:bg-foreground/25 focus-visible:ring-ring/50 relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors before:absolute before:-inset-1 before:content-[""] focus-visible:ring-1 focus-visible:outline-none',
        FADE_IN
      )}
    >
      <PlusIcon />
    </button>
  )
  const row = variant === 'row'
  const className = cn(
    'flex w-full items-center text-left transition-[padding,gap] duration-300',
    !row && 'bg-card rounded-2xl',
    density.padding,
    density.gap
  )
  const press =
    'active:bg-muted focus-visible:ring-ring/50 transition-colors focus-visible:ring-1 focus-visible:ring-inset focus-visible:outline-none'

  // Multi-Add: hai nút riêng (chọn món / thêm nhanh) nên không được lồng nút trong nút.
  const split = highlight === 'MultiAdd' && onSelect
  return (
    <AnimatedHeight className={row ? undefined : 'rounded-2xl'}>
      {split ? (
        <div className={className}>
          <button
            type="button"
            onClick={onSelect}
            className={cn('flex min-w-0 flex-1 items-center text-left', density.gap, press)}
          >
            {main}
          </button>
          {plusButton}
        </div>
      ) : onSelect ? (
        <button type="button" onClick={onSelect} className={cn(className, press)}>
          {main}
          {editBadge}
          {plusButton}
        </button>
      ) : (
        <div className={className}>
          {main}
          {editBadge}
          {plusButton}
        </div>
      )}
    </AnimatedHeight>
  )
}
