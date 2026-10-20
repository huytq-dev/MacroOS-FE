import { cn } from '@/lib/utils'

/**
 * Dải đầu trang Full Body / All Metrics / Compare (như MacroFactor): nền `bg-card` kín bề ngang, dính trên cùng, chứa tiêu đề và
 * hàng nút / tab; nội dung bên dưới nằm trên nền tối hơn. `flush` bỏ lề đáy để vạch tab nằm sát mép dải.
 */
export function FullBodyHeader({
  flush = false,
  children,
}: {
  readonly flush?: boolean
  readonly children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'bg-card sticky top-0 z-30 space-y-3 px-4 max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.75rem)] md:rounded-2xl md:pt-4',
        flush ? 'pb-0' : 'pb-4'
      )}
    >
      {children}
    </div>
  )
}

/** Lịch đặc có ô ngày (biểu tượng "event" của MacroFactor). */
export function EventIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1h-2zm3 18H5V8h14v11z" />
    </svg>
  )
}

/** Tài liệu đặc (nút View All Metrics). */
export function ArticleIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  )
}

/** Hai nửa so sánh (nút Compare All Metrics). */
export function CompareIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
    </svg>
  )
}
