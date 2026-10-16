import { Loader2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface IconButtonProps extends Omit<React.ComponentProps<typeof Button>, 'size' | 'children' | 'aria-label'> {
  readonly icon: LucideIcon
  /** Nhãn bắt buộc: dùng cho aria-label và chú thích khi rê chuột (UI.md mục 7, 21). */
  readonly label: string
  readonly loading?: boolean
}

/** Nút chỉ có biểu tượng. Đang xử lý: spinner thay biểu tượng, giữ nguyên kích thước (UI.md mục 12). */
export function IconButton({ icon: Icon, label, loading = false, variant = 'ghost', disabled, ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="icon" aria-label={label} aria-busy={loading || undefined} disabled={disabled || loading} {...props}>
          {loading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Icon aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
