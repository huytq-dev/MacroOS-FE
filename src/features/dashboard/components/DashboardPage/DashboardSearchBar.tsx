'use client'

import { ShortcutToolbarContent } from '@/features/shortcuts/components/ShortcutToolbarContent'
import { useShortcutRunner } from '@/features/shortcuts/hooks/use-shortcut-runner'
import { useShortcuts } from '@/features/shortcuts/hooks/use-shortcuts'
import { useScrollHidden } from '@/hooks/use-scroll-hidden'
import { cn } from '@/lib/utils'

interface DashboardSearchBarProps {
  readonly onSearch: () => void
  /** Bấm nút mã vạch; không truyền thì chạy shortcut Barcode (mở Thêm món ở tab quét). */
  readonly onScan?: () => void
  /** Chỉ Dashboard bật: ẩn khi cuộn xuống, hiện khi cuộn lên. Mặc định luôn hiện. */
  readonly autoHide?: boolean
}

/**
 * Toolbar dính trên thanh tab (kiểu MacroFactor): nội dung theo Toolbar Style user chọn ở Customize (Search and Barcode, thêm một nút
 * tuỳ chọn, bốn nút tuỳ chọn, hoặc ẩn hẳn). Ô tìm mở sheet Thêm món, các nút tròn chạy shortcut tương ứng.
 * Có `autoHide` thì cuộn xuống mờ dần và trượt xuống, cuộn lên (hoặc về đầu trang) hiện lại; ẩn rồi thì không bấm được.
 */
export function DashboardSearchBar({
  onSearch,
  onScan,
  autoHide = false,
}: DashboardSearchBarProps) {
  const scrollHidden = useScrollHidden()
  const { config } = useShortcuts()
  const run = useShortcutRunner()
  const hidden = autoHide && scrollHidden
  if (config.toolbarStyle === 'None') return null
  return (
    <div
      inert={hidden}
      aria-hidden={hidden}
      className={cn(
        'bg-card border-border fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 flex gap-3 border-t px-4 py-2.5 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none md:hidden',
        hidden ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <ShortcutToolbarContent
        style={config.toolbarStyle}
        items={config.items}
        onSearch={onSearch}
        onScan={onScan ?? (() => run('barcode'))}
        onRun={run}
      />
    </div>
  )
}
