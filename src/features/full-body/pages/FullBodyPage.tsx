'use client'

import { useState } from 'react'
import { Plus, Ruler } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useFullBodyHistory } from '@/features/shortcuts/hooks/use-body-metrics'
import { FullBodyShortcutPage } from '@/features/shortcuts/pages/FullBodyShortcutPage'
import { FullBodyHeader, FullBodyLinks, FullBodyList } from '../components/FullBodyPage'

/**
 * Trang Full Body (MacroFactor): ‹ "Full Body" +, hai nút View All Metrics / Compare All Metrics, danh sách ngày có số đo
 * theo tháng. "+" mở bảng nhập hôm nay, bấm một hàng mở bảng của ngày đó (dùng chung bảng của shortcut Metrics).
 */
export function FullBodyPage() {
  const history = useFullBodyHistory()
  // `id` đổi mỗi lần mở để bảng dựng lại với ngày mới; giữ nguyên khi đóng để hoạt ảnh đóng kịp chạy
  const [sheet, setSheet] = useState<{ open: boolean; date?: string; id: number }>({
    open: false,
    id: 0,
  })
  const open = (date?: string) => setSheet((current) => ({ open: true, date, id: current.id + 1 }))
  const items = history.data ?? []

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-24 md:pb-0">
      <FullBodyHeader>
        <SubPageHeader
          title="Full Body"
          action={
            <IconButton
              icon={Plus}
              label="Add Full Body metrics"
              className="size-11 [&_svg]:size-7!"
              onClick={() => open()}
            />
          }
        />
        <FullBodyLinks canView={items.length > 0} canCompare={items.length >= 2} />
      </FullBodyHeader>

      {history.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      ) : history.isError ? (
        <ErrorState
          error={history.error}
          variant="inline"
          onRetry={() => void history.refetch()}
          isRetrying={history.isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="No measurements yet"
          description="Tap + to log body fat and tape measurements."
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300"
        />
      ) : (
        <FullBodyList items={items} onOpen={open} />
      )}

      <FullBodyShortcutPage
        key={sheet.id}
        open={sheet.open}
        onOpenChange={(next) => setSheet((current) => ({ ...current, open: next }))}
        initialDate={sheet.date}
      />
    </div>
  )
}
