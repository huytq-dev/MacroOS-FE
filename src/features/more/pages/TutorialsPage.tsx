'use client'

import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { persistChoice, usePersistedChoice } from '@/features/dashboard/hooks/use-dashboard'
import { TUTORIALS, type TutorialEntry } from '../tutorials.config'
import { SettingCard } from '../components/SettingRows'

const CHOICES = ['show', 'hidden'] as const

function TutorialRow({ entry }: { readonly entry: TutorialEntry }) {
  const [state] = usePersistedChoice(entry.key, 'show', CHOICES)
  const hidden = state === 'hidden'
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-snug">{entry.title}</span>
        <span className="text-muted-foreground block text-base">
          {hidden ? 'Dismissed' : `Showing on ${entry.where}`}
        </span>
      </span>
      {hidden && (
        <button
          type="button"
          aria-label={`Show ${entry.title} tutorial again`}
          onClick={() => persistChoice(entry.key, 'show')}
          className="bg-secondary active:bg-foreground/20 focus-visible:ring-ring/50 h-11 shrink-0 rounded-full px-5 text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          Show
        </button>
      )}
    </div>
  )
}

/**
 * More › Tutorials: danh sách các hướng dẫn trong app; cái nào đã "Dismiss Tutorial" thì có nút "Show" đặt lại cờ localStorage để thẻ hiện lại ở trang của nó.
 * Chỉ FE, không BE (cờ là lựa chọn theo trình duyệt như mọi chỗ khác dùng `usePersistedChoice`).
 */
export function TutorialsPage() {
  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6 md:pb-0">
      <SubPageHeader title="Tutorials" />
      <SettingCard>
        {TUTORIALS.map((entry) => (
          <TutorialRow key={entry.key} entry={entry} />
        ))}
      </SettingCard>
      <button
        type="button"
        onClick={() => TUTORIALS.forEach((entry) => persistChoice(entry.key, 'show'))}
        className="bg-secondary active:bg-foreground/20 focus-visible:ring-ring/50 h-14 rounded-lg text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        Show All Tutorials
      </button>
    </div>
  )
}
