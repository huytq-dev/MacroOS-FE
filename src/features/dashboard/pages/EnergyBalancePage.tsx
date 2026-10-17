'use client'

import { useState } from 'react'
import { ChartColumn } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import { CollapseChartIcon, ExpandChartIcon, RangeBar, StatBlock } from '../components/DetailPage'
import {
  EnergyBalanceChart,
  EnergyBalanceInsights,
  ModeTabs,
} from '../components/EnergyBalancePage'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useEnergyBalanceDetail } from '../hooks/use-energy-balance-detail'
import type { BalanceMode } from '../dashboard.utils'
import type { Averaging, RangeKey } from '../expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const BALANCE_MODES = ['expenditure', 'targets'] as const

/**
 * Chi tiết "Energy Balance" (bấm thẻ/ô Energy Balance ở Dashboard): tab Expenditure / Calorie Targets, số lớn của kỳ,
 * cột kcal đã ăn so với đường mốc, chọn kỳ 1W…All và D/W/M, phóng to biểu đồ và các hàng "Relative to …".
 */
export function EnergyBalancePage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const [expanded, setExpanded] = useState(false)
  // Cùng key với thẻ Energy Balance ở Dashboard nên hai nơi luôn đồng bộ.
  const [mode, setMode] = usePersistedChoice<BalanceMode>(
    'dashboard.balanceMode',
    'expenditure',
    BALANCE_MODES
  )
  const data = useEnergyBalanceDetail(range, averaging, mode)

  if ('isError' in data && data.isError)
    return <ErrorState error={new Error('Could not load Energy Balance')} />

  const targets = mode === 'targets'

  return (
    <div className="flex max-w-2xl flex-col gap-5 md:pb-0">
      <SubPageHeader title="Energy Balance" />
      <ModeTabs value={mode} onChange={setMode} />

      {data.isLoading || data.summary === null ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <StatBlock
              label={data.summary.label}
              value={data.summary.value === null ? null : String(data.summary.value)}
              unit="kcal"
            />
            <IconButton
              icon={expanded ? CollapseChartIcon : ExpandChartIcon}
              label={expanded ? 'Shrink chart' : 'Expand chart'}
              variant="secondary"
              className="size-14 rounded-full"
              onClick={() => setExpanded((value) => !value)}
            />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{data.label}</p>

          <EnergyBalanceChart
            points={data.shown}
            range={range}
            mode={mode}
            height={expanded ? 460 : 300}
            className="transition-[height] duration-300"
          />
          <RangeBar
            range={range}
            onRangeChange={setRange}
            averaging={averaging}
            onAveragingChange={setAveraging}
          />

          {!expanded && (
            <>
              <div className="bg-card text-foreground flex items-center justify-center gap-6 rounded-xl px-4 py-4 text-base">
                <span className="flex items-center gap-2">
                  <ChartColumn
                    aria-hidden="true"
                    strokeWidth={3}
                    className="text-mf-tile-calories size-5"
                  />
                  Calories
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex items-center gap-0.5">
                    {[0, 1, 2].map((dash) => (
                      <span
                        key={dash}
                        className={cn(
                          'h-0.5 w-1.5 rounded-full',
                          targets ? 'bg-mf-tile-fat' : 'bg-mf-tile-protein'
                        )}
                      />
                    ))}
                  </span>
                  {targets ? 'Targets' : 'Expenditure'}
                </span>
              </div>
              <EnergyBalanceInsights mode={mode} changes={data.changes} />
            </>
          )}
        </>
      )}
    </div>
  )
}
