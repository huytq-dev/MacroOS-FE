'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { routePath } from '@/config/route-path'
import { useProfile } from '../hooks/use-profile'

const PROMPT_KEY = 'macroos.time-zone-prompt'

/**
 * Chờ hồ sơ tải xong rồi mới dựng app: `useProfile` đặt múi giờ nghiệp vụ (`effectiveTimeZone`) cho `todayIso()`, nên mọi màn đều tính "hôm nay" cùng BE (múi giờ
 * hồ sơ, hoặc UTC khi hồ sơ chưa đặt). Hồ sơ lỗi thì vẫn cho vào (dùng giờ máy, như trước). Khi BE phải dự phòng UTC (`timeZoneFallback` = Missing / Invalid) thì nhắc
 * user chọn múi giờ (một lần mỗi phiên cho mỗi lý do), trỏ tới mục Time zone ở Profile.
 */
export function TimeZoneGate({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter()
  const profile = useProfile()
  const fallback = profile.data?.timeZoneFallback ?? null

  useEffect(() => {
    if (fallback === null) return
    try {
      if (window.sessionStorage.getItem(PROMPT_KEY) === fallback) return
      window.sessionStorage.setItem(PROMPT_KEY, fallback)
    } catch {
      // không có storage: vẫn nhắc (mỗi lần mở app)
    }
    toast.warning(fallback === 'Invalid' ? 'Your time zone is not valid' : 'Set your time zone', {
      id: 'time-zone',
      duration: 15000,
      description:
        'Until you choose one, dates follow UTC, so "today" can differ from your local day.',
      action: {
        label: 'Set time zone',
        onClick: () => router.push(`${routePath.profile}#units`),
      },
    })
  }, [fallback, router])

  if (profile.isPending) return <div className="bg-background min-h-dvh" aria-busy="true" />
  return <>{children}</>
}
