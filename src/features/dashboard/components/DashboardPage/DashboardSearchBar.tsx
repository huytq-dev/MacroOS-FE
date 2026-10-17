import Link from 'next/link'
import { BookOpen, Search } from 'lucide-react'
import { routePath } from '@/config/route-path'

interface DashboardSearchBarProps {
  readonly onSearch: () => void
}

/** Thanh tìm món dính trên thanh tab (kiểu MacroFactor): chạm ô tìm mở sheet Thêm món, nút sách mở thư viện thực phẩm. */
export function DashboardSearchBar({ onSearch }: DashboardSearchBarProps) {
  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 flex gap-3 px-4 py-2 backdrop-blur-md md:hidden">
      <button
        type="button"
        onClick={onSearch}
        className="bg-secondary text-muted-foreground focus-visible:ring-ring/50 flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full px-4 text-left text-base focus-visible:ring-1 focus-visible:outline-none"
      >
        <Search aria-hidden="true" className="text-foreground size-5 shrink-0" />
        Search foods
      </button>
      <Link
        href={routePath.foods}
        aria-label="Food library"
        className="bg-secondary focus-visible:ring-ring/50 flex size-12 shrink-0 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
      >
        <BookOpen aria-hidden="true" className="size-5" />
      </Link>
    </div>
  )
}
