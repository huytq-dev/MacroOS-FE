import Link from 'next/link'
import { ChartColumn } from 'lucide-react'
import type { NutrientInfo } from '../nutrient-detail.utils'
import { routePath } from '@/config/route-path'

/** Chú giải biểu đồ một chất: Intake (cột màu của chất), Target (đường liền), Range (dải mờ floor → ceiling) và nút ⓘ mở "About Nutrient Goals". */
export function NutrientLegend({ info }: { readonly info: NutrientInfo }) {
  return (
    <div className="bg-card text-foreground flex items-center justify-between gap-3 rounded-xl px-4 py-4 text-base">
      <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-2">
          <ChartColumn
            aria-hidden="true"
            strokeWidth={3}
            className="size-5"
            style={{ color: info.color }}
          />
          Intake
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-foreground/70 h-0.5 w-4 rounded-full" />
          Target
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3.5 rounded-xs opacity-45"
            style={{ backgroundColor: info.color }}
          />
          Range
        </span>
      </div>
      <Link
        href={routePath.dashboardNutrientGoals(info.nutrient.key)}
        aria-label="About nutrient goals"
        className="focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-transform focus-visible:ring-1 focus-visible:outline-none motion-safe:active:scale-90"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
          <circle cx="12" cy="12" r="10" className="fill-foreground" />
          <path
            d="M12 10.8v6"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-background"
          />
          <circle cx="12" cy="7.6" r="1.3" className="fill-background" />
        </svg>
      </Link>
    </div>
  )
}
