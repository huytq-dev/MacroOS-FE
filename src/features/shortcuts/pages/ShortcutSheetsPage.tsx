'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { routePath } from '@/config/route-path'
import { useUiStore } from '@/stores/ui.store'
import { ShortcutsSheet } from '../components/ShortcutsSheet'
import { useShortcutRunner } from '../hooks/use-shortcut-runner'
import { useShortcuts } from '../hooks/use-shortcuts'
import { FullBodyShortcutPage } from './FullBodyShortcutPage'
import { ProgressPhotosShortcutPage } from './ProgressPhotosShortcutPage'
import { WeightShortcutPage } from './WeightShortcutPage'

/**
 * Chỗ đặt (một lần, trong layout) mọi sheet của shortcut: Shortcuts, Weight, Metrics, Photos. Trạng thái mở nằm trong `useUiStore` để
 * nút "+" ở thanh tab, toolbar và trang Customize cùng điều khiển được. Mỗi lần mở một sheet nhập liệu thì dựng lại (`sheetSession`)
 * để form luôn sạch và ngày là hôm nay. Sheet Shortcuts tự đóng khi đường dẫn đổi (chạm liên kết New Recipe / New Food / Customize).
 */
export function ShortcutSheetsPage() {
  const pathname = usePathname()
  const { config } = useShortcuts()
  const run = useShortcutRunner()
  const shortcutsOpen = useUiStore((state) => state.shortcutsOpen)
  const setShortcutsOpen = useUiStore((state) => state.setShortcutsOpen)
  const activeSheet = useUiStore((state) => state.activeSheet)
  const sheetSession = useUiStore((state) => state.sheetSession)
  const closeSheet = useUiStore((state) => state.closeSheet)
  const onOpenChange = (open: boolean) => {
    if (!open) closeSheet()
  }

  useEffect(() => {
    setShortcutsOpen(false)
  }, [pathname, setShortcutsOpen])

  return (
    <>
      <ShortcutsSheet
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        config={config}
        onRun={run}
        customizeHref={routePath.shortcuts}
      />
      <WeightShortcutPage
        key={`weight-${sheetSession}`}
        open={activeSheet === 'weight'}
        onOpenChange={onOpenChange}
      />
      <FullBodyShortcutPage
        key={`metrics-${sheetSession}`}
        open={activeSheet === 'metrics'}
        onOpenChange={onOpenChange}
      />
      <ProgressPhotosShortcutPage
        key={`photos-${sheetSession}`}
        open={activeSheet === 'photos'}
        onOpenChange={onOpenChange}
      />
    </>
  )
}
