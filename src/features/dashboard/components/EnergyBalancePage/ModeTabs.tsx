'use client'

import { Flame } from 'lucide-react'
import { UnderlineTabs, type UnderlineTab } from '../DetailPage'
import type { BalanceMode } from '../../dashboard.utils'

const TABS = [
  {
    value: 'expenditure' as const,
    label: 'Expenditure',
    icon: <Flame aria-hidden="true" fill="currentColor" className="size-6" />,
  },
  {
    value: 'targets' as const,
    label: 'Calorie Targets',
    icon: (
      <span
        aria-hidden="true"
        className="bg-foreground flex size-6 items-center justify-center rounded-full"
      >
        <span className="bg-background size-2 rounded-full" />
      </span>
    ),
  },
] satisfies readonly [UnderlineTab<BalanceMode>, UnderlineTab<BalanceMode>]

interface ModeTabsProps {
  readonly value: BalanceMode
  readonly onChange: (mode: BalanceMode) => void
}

/** Hai tab đầu trang Energy Balance (Expenditure / Calorie Targets) với vạch trắng trượt bên dưới. */
export function ModeTabs({ value, onChange }: ModeTabsProps) {
  return <UnderlineTabs tabs={TABS} value={value} onChange={onChange} ariaLabel="Compare to" />
}
