'use client'

import { useRouter } from 'next/navigation'
import { routePath } from '@/config/route-path'
import { goBack } from '@/lib/back-target'
import { Skeleton } from '@/components/ui/skeleton'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ShortcutsCustomize } from '../components'
import { useSaveShortcuts, useShortcuts } from '../hooks/use-shortcuts'

/** `/shortcuts`: trang Customize. Chờ cấu hình tải xong để bản nháp bắt đầu từ cấu hình đã lưu; Save lưu rồi quay lại. */
export function ShortcutsPage() {
  const router = useRouter()
  const { config, isLoading } = useShortcuts()
  const save = useSaveShortcuts()

  if (isLoading)
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-4" aria-busy="true">
        <Skeleton className="h-11 rounded-full" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  return (
    <ShortcutsCustomize
      initial={config}
      isSaving={save.isPending}
      error={save.error ? getFormErrorMessage(save.error) : null}
      onSave={(draft) => save.mutate(draft, { onSuccess: () => goBack(router, routePath.shortcuts) })}
      onExit={() => goBack(router, routePath.shortcuts)}
    />
  )
}
