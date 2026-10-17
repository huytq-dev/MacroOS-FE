import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

export const DETAIL_CARD = 'bg-card overflow-hidden rounded-xl'

/** Số lớn đầu trang chi tiết (Average / Difference): nhãn mờ phía trên, giá trị kèm đơn vị; null hiện "---". */
export function StatBlock({
  label,
  value,
  unit,
}: {
  readonly label: string
  readonly value: string | null
  readonly unit: string
}) {
  return (
    <div>
      <p className="text-muted-foreground text-base">{label}</p>
      <p className="text-4xl font-medium tabular-nums">
        {value ?? '---'}
        <span className="text-muted-foreground ml-1.5 text-lg font-normal">{unit}</span>
      </p>
    </div>
  )
}

/** Ô xám bo góc bên trái của các dòng "Current …" trong Insights & Data. */
export function StatBox({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="bg-foreground/10 flex w-28 shrink-0 flex-col items-center justify-center self-stretch rounded-sm p-3 text-center">
      {children}
    </div>
  )
}

/** Dòng nguồn dữ liệu ("Manage Data") dẫn tới trang quản lý. */
export function SourceRow({
  icon: Icon,
  title,
  href,
}: {
  readonly icon: LucideIcon | React.ComponentType<{ className?: string }>
  readonly title: string
  readonly href: string
}) {
  return (
    <Link
      href={href}
      className="active:bg-muted focus-visible:ring-ring/50 flex min-h-16 items-center gap-4 px-4 focus-visible:ring-1 focus-visible:outline-none"
    >
      <Icon className="size-6 shrink-0" />
      <span className="flex-1">
        <span className="block text-lg">{title}</span>
        <span className="text-muted-foreground block text-base">Manage Data</span>
      </span>
      <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
    </Link>
  )
}

/** Dòng chỉ số: ô xám có số + đơn vị bên trái, tiêu đề và mô tả bên phải (Insights & Data). */
export function MetricRow({
  value,
  unit,
  title,
  text,
}: {
  readonly value: string
  readonly unit: string
  readonly title: string
  readonly text: string
}) {
  return (
    <div className="flex items-start gap-4">
      <StatBox>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground text-base">{unit}</span>
      </StatBox>
      <div>
        <h3 className="text-lg">{title}</h3>
        <p className="text-muted-foreground text-base leading-snug">{text}</p>
      </div>
    </div>
  )
}
