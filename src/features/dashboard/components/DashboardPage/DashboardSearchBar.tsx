'use client'

import { ScanBarcode, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useScrollHidden } from '@/hooks/use-scroll-hidden'
import { cn } from '@/lib/utils'

interface DashboardSearchBarProps {
  readonly onSearch: () => void
  /** Bấm nút mã vạch; không truyền thì chỉ báo "sắp có". */
  readonly onScan?: () => void
}

/**
 * Thanh tìm món dính trên thanh tab (kiểu MacroFactor): ô tìm (kèm nút quét mã vạch) mở sheet Thêm món, nút tia lấp lánh là ghi món bằng AI.
 * Quét mã vạch và AI chưa có tính năng thật nên bấm chỉ báo "sắp có" (thư viện thực phẩm nằm ở More → My Foods).
 * Cuộn xuống thì mờ dần và trượt xuống, cuộn lên (hoặc về đầu trang) thì hiện lại; ẩn rồi thì không bấm được.
 */
export function DashboardSearchBar({ onSearch, onScan }: DashboardSearchBarProps) {
  const hidden = useScrollHidden()
  return (
    <div
      inert={hidden}
      aria-hidden={hidden}
      className={cn(
        'bg-card border-border fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 flex gap-3 border-t px-4 py-2.5 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none md:hidden',
        hidden ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <div className="bg-foreground/12 flex h-12 min-w-0 flex-1 items-center rounded-full">
        <button
          type="button"
          onClick={onSearch}
          className="text-muted-foreground focus-visible:ring-ring/50 flex h-full min-w-0 flex-1 items-center gap-3 rounded-full pl-5 text-left text-base font-normal focus-visible:ring-1 focus-visible:outline-none"
        >
          <Search
            aria-hidden="true"
            className="text-foreground/80 size-5 shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">Search for a food</span>
        </button>
        <button
          type="button"
          aria-label="Scan barcode"
          onClick={onScan ?? (() => toast('Barcode scanning is coming soon'))}
          className="focus-visible:ring-ring/50 flex size-12 shrink-0 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
        >
          <ScanBarcode aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </button>
      </div>
      <button
        type="button"
        aria-label="Log with AI"
        onClick={() => toast('AI food logging is coming soon')}
        className="bg-foreground/12 active:bg-foreground/20 focus-visible:ring-ring/50 flex size-12 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <Sparkles aria-hidden="true" className="size-5" strokeWidth={2} />
      </button>
    </div>
  )
}
