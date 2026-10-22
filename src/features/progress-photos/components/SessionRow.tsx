'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { formatWeekdayMonthDay } from '@/lib/week'
import { cn } from '@/lib/utils'
import { ANGLES, photoOf } from '../progress-photos.utils'
import type { PhotoSession } from '../types/progress-photos.types'

interface SessionRowProps {
  readonly session: PhotoSession
  readonly onEdit: (session: PhotoSession) => void
}

/**
 * Một ngày có ảnh trong danh sách theo tháng (như MacroFactor): tối đa ba ảnh tròn chồng lên nhau (Front, Side, Back), ngày "Tue, Oct 20"
 * bên phải và nút bút chì mở sheet sửa. Chạm cả hàng mở màn xem đúng ngày đó.
 */
export function SessionRow({ session, onEdit }: SessionRowProps) {
  const thumbs = ANGLES.flatMap((angle) => {
    const photo = photoOf(session, angle)
    return photo ? [{ angle, url: photo.url }] : []
  })
  return (
    <div className="bg-card flex items-center gap-2 rounded-xl py-1.5 pr-2 pl-3 transition-colors">
      <Link
        href={`${routePath.progressPhotosGallery}?date=${session.date}`}
        className="focus-visible:ring-ring/50 active:bg-muted flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:ring-1 focus-visible:outline-none"
      >
        <span className="flex shrink-0 items-center" aria-hidden="true">
          {thumbs.map((thumb, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn, next/image không tối ưu được
            <img
              key={thumb.angle}
              src={thumb.url}
              alt=""
              loading="lazy"
              className={cn(
                'border-card motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-90 motion-safe:animation-duration-300 size-8 rounded-full border-2 object-cover',
                index > 0 && '-ml-2.5'
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            />
          ))}
        </span>
        <span className="text-muted-foreground ml-auto truncate text-base tabular-nums">
          {formatWeekdayMonthDay(session.date)}
        </span>
      </Link>
      <button
        type="button"
        aria-label={`Edit photos from ${formatWeekdayMonthDay(session.date)}`}
        onClick={() => onEdit(session)}
        className="focus-visible:ring-ring/50 group flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
      >
        <span className="bg-secondary group-active:bg-foreground/20 flex size-8 items-center justify-center rounded-full transition-[background-color,transform] duration-100 group-active:scale-90 motion-reduce:group-active:scale-100">
          <Pencil aria-hidden="true" className="size-4" />
        </span>
      </button>
    </div>
  )
}
