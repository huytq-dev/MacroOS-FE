import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AuthAltActionProps {
  /** Câu dẫn, vd. "Chưa có tài khoản?" */
  readonly prompt: string
  readonly label: string
  readonly href: string
}

/**
 * Lối rẽ sang màn auth khác (đăng nhập ↔ đăng ký) dưới dạng nút phụ `outline`, ngay dưới nút chính.
 * Mỗi màn chỉ có một nút chính nổi bật; đây là nút phụ nên nhìn thấy được nhưng không cạnh tranh.
 */
export function AuthAltAction({ prompt, label, href }: AuthAltActionProps) {
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-3 text-xs" aria-hidden="true">
        <span className="bg-border h-px flex-1" />
        <span>{prompt}</span>
        <span className="bg-border h-px flex-1" />
      </div>
      <Button asChild variant="outline" className="h-12 w-full text-base md:h-10 md:text-sm">
        <Link href={href} aria-label={`${prompt} ${label}`}>
          {label}
        </Link>
      </Button>
    </div>
  )
}
