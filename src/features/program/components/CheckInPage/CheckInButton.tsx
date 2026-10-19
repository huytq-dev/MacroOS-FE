import Link from 'next/link'
import { routePath } from '@/config/route-path'

/**
 * Nút "CHECK IN" của tab Strategy khi đã tới hạn (thay vòng đếm ngược): nút trắng lớn, viền sáng nhấp nháy nhẹ để kéo mắt;
 * mở hub check-in.
 */
export function CheckInButton() {
  return (
    <section aria-label="Check-in" className="flex flex-col items-center gap-3 py-6">
      <Link
        href={routePath.programCheckIn}
        className="bg-foreground text-background focus-visible:ring-ring/50 relative flex h-16 w-full max-w-72 items-center justify-center rounded-full text-xl font-bold tracking-wide transition-transform duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
      >
        <span
          aria-hidden="true"
          className="ring-foreground/40 absolute inset-0 rounded-full ring-4 motion-safe:animate-pulse"
        />
        <span className="relative">CHECK IN</span>
      </Link>
      <p className="text-muted-foreground text-base">It&apos;s time for your weekly check-in</p>
    </section>
  )
}
