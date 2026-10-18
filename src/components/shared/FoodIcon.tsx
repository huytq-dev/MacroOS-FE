'use client'

import { useState } from 'react'
import { foodIconUrl, type FoodIconSize } from '@/lib/food-icons'
import { cn } from '@/lib/utils'

interface FoodIconProps {
  /** Khoá icon của món (BE `iconKey`); thiếu hoặc ảnh lỗi thì hiện emoji dự phòng. */
  readonly iconKey?: string | null
  /** Emoji dự phòng (BE `emoji`); thiếu thì 🍽️. */
  readonly emoji?: string | null
  /** Cạnh ô (px); icon vuông. */
  readonly size: number
  readonly source?: FoodIconSize
  readonly className?: string
}

function EmojiFallback({
  emoji,
  size,
  className,
}: {
  readonly emoji?: string | null
  readonly size: number
  readonly className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center leading-none', className)}
      style={{ width: size, height: size, fontSize: size * 0.8 }}
    >
      {emoji ?? '🍽️'}
    </span>
  )
}

/** Một icon đã biết khoá: ảnh WebP tĩnh, tải lười, kích thước cố định để không giật layout; lỗi tải thì rơi về emoji. */
function IconImage({
  iconKey,
  emoji,
  size,
  source = 128,
  className,
}: FoodIconProps & { iconKey: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <EmojiFallback emoji={emoji} size={size} className={className} />
  return (
    // eslint-disable-next-line @next/next/no-img-element -- file WebP tĩnh đã tối ưu sẵn, không cần bộ tối ưu ảnh của Next
    <img
      src={foodIconUrl(iconKey, source)}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn('shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Icon món ăn: ảnh theo `iconKey` nếu có, không thì emoji (hành vi cũ). Trang trí nên ẩn khỏi trình đọc màn hình. */
export function FoodIcon(props: FoodIconProps) {
  const { iconKey, emoji, size, className } = props
  // key theo iconKey để đổi icon thì trạng thái "ảnh lỗi" được đặt lại
  return iconKey ? (
    <IconImage key={iconKey} {...props} iconKey={iconKey} />
  ) : (
    <EmojiFallback emoji={emoji} size={size} className={className} />
  )
}
