'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const ROW = 'flex min-h-16 items-center gap-3 px-4 py-3'

/** Thẻ nhóm hàng cài đặt (nền thẻ, bo, vạch mảnh giữa các hàng) như More / Expenditure của MacroFactor. */
export function SettingCard({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
      {children}
    </div>
  )
}

interface SettingRowProps {
  readonly title: string
  readonly subtitle?: string
  /** Nút viên "Edit" bên phải (mở bảng); `link` = mũi tên (sang trang con). */
  readonly action: 'edit' | 'link'
  /** Chưa có tính năng / BE: mờ, không bấm được, không điều hướng. */
  readonly disabled?: boolean
  readonly onEdit?: () => void
  readonly href?: string
  readonly editLabel?: string
  /** Chỉ hiển thị một giá trị thật của BE (không có gì để sửa): không nút, không mờ (vd. Algorithm). */
  readonly readOnly?: boolean
}

/** Một hàng cài đặt: tên + phụ đề ở trái, nút "Edit" (hoặc mũi tên) ở phải; `disabled` thì chỉ hiển thị. */
export function SettingRow({
  title,
  subtitle,
  action,
  disabled = false,
  onEdit,
  href,
  editLabel,
  readOnly = false,
}: SettingRowProps) {
  const text = (
    <span className="min-w-0 flex-1">
      <span className="block text-lg leading-snug">{title}</span>
      {subtitle && <span className="text-muted-foreground block text-base">{subtitle}</span>}
    </span>
  )
  if (readOnly) return <div className={ROW}>{text}</div>
  if (action === 'link' && href && !disabled)
    return (
      <Link
        href={href}
        className={cn(
          ROW,
          'active:bg-muted focus-visible:ring-ring/50 focus-visible:ring-1 focus-visible:outline-none'
        )}
      >
        {text}
        <ChevronRight aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
      </Link>
    )
  return (
    <div className={cn(ROW, disabled && 'opacity-50')} aria-disabled={disabled || undefined}>
      {text}
      {action === 'link' ? (
        <ChevronRight aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-label={editLabel ?? `Edit ${title}`}
          onClick={onEdit}
          className="bg-secondary active:bg-foreground/20 focus-visible:ring-ring/50 h-11 shrink-0 rounded-full px-5 text-base transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed"
        >
          Edit
        </button>
      )}
    </div>
  )
}

/** Hàng công tắc (Expenditure Modifiers): chưa có BE thì công tắc mờ, không bật được, ghi rõ "Not available yet". */
export function SettingSwitchRow({
  title,
  description,
  disabled,
}: {
  readonly title: string
  readonly description: string
  readonly disabled: boolean
}) {
  return (
    <div className={cn(ROW, disabled && 'opacity-50')} aria-disabled={disabled || undefined}>
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-snug">{title}</span>
        <span className="text-muted-foreground block text-base">{description}</span>
      </span>
      <Switch aria-label={title} checked={false} disabled={disabled} />
    </div>
  )
}
