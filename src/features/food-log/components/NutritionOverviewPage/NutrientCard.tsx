import { ChevronRight } from 'lucide-react'
import type { NutrientDef } from '@/features/dashboard/types/dashboard.types'
import { cn } from '@/lib/utils'
import {
  MACRO_BAR,
  displayName,
  formatAmount,
  type Contributor,
} from '../../nutrition-overview.utils'

/**
 * Hình học thanh: vạch mục tiêu nằm ở `at`% chiều dài nên cả thanh = (100/at) lần mục tiêu; vùng nên đạt tô màu TỐI của nhóm
 * (floor từ `floorStart` tới hết thanh, ceiling từ đầu tới `ceilingEnd`). Thanh mảnh của hàng chất theo MacroFactor (vạch ở 80%,
 * vùng sàn từ 55%); thanh dày của thẻ macro giữ vạch ở giữa.
 */
const BAR_GEOMETRY = {
  thin: { at: 80, floorStart: 55, ceilingEnd: 80 },
  thick: { at: 50, floorStart: 36, ceilingEnd: 83 },
} as const

interface NutrientBarProps {
  readonly kind: NutrientDef['kind']
  readonly value: number
  readonly target: number | null
  /** Mốc tham chiếu khi chưa có mục tiêu (vd. Sugars so với tổng Carbs): phần đã ăn tô theo tỉ lệ so với mốc này. */
  readonly reference?: number | null
  /** Lớp màu nền của thanh (vd. `bg-mf-tile-fat`): phần đã ăn dùng đúng màu này, vùng mục tiêu là bản mờ của nó trên nền tối. */
  readonly tone: string
  /** Thanh mảnh 6px kiểu hàng chất của MacroFactor; mặc định là thanh dày của thẻ macro. */
  readonly thin?: boolean
}

/**
 * Thanh tiến độ như MacroFactor: nền tối, vùng nên đạt tô màu tối của nhóm tới hết thanh, phần đã ăn tô màu sáng của nhóm từ trái
 * (đổi lượng thì chạy mượt theo chiều rộng), vạch mục tiêu mảnh xám nhạt. Chất có thanh nhưng chưa có mục tiêu thì cả thanh là vùng
 * tối (như Sugars) và không có phần đã ăn.
 */
export function NutrientBar({
  kind,
  value,
  target,
  reference = null,
  tone,
  thin = false,
}: NutrientBarProps) {
  const geometry = thin ? BAR_GEOMETRY.thin : BAR_GEOMETRY.thick
  const filled =
    target && target > 0
      ? Math.min(100, (value / target) * geometry.at)
      : reference && reference > 0
        ? Math.min(100, (value / reference) * 100)
        : 0
  const zone =
    target === null
      ? { left: '0%', right: '0%' }
      : kind === 'floor'
        ? { left: `${geometry.floorStart}%`, right: '0%' }
        : kind === 'ceiling'
          ? { left: '0%', right: `${100 - geometry.ceilingEnd}%` }
          : null
  const marker = target !== null && (
    <span
      className={cn(
        'absolute top-1/2 -translate-y-1/2',
        thin ? 'bg-foreground/45 h-3 w-px' : 'bg-foreground/60 h-2.5 w-0.5'
      )}
      style={{ left: `${geometry.at}%` }}
    />
  )
  const track = (
    <div
      className={cn(
        'relative overflow-hidden',
        thin ? 'bg-foreground/[0.07] h-1.5 rounded-full' : 'bg-foreground/10 h-6 rounded-sm'
      )}
    >
      {zone && <span className={cn('absolute inset-y-0 opacity-30', tone)} style={zone} />}
      <span
        className={cn(
          'absolute inset-y-0 left-0 transition-[width] duration-500 ease-out motion-reduce:transition-none',
          thin && 'rounded-full',
          tone
        )}
        style={{ width: `${filled}%` }}
      />
      {!thin && marker}
    </div>
  )
  // Thanh mảnh: vạch mục tiêu cao hơn thanh nên nằm ngoài khung cắt (overflow-hidden) của thanh
  return thin ? (
    <div aria-hidden="true" className="relative flex h-3 items-center">
      <div className="w-full">{track}</div>
      {marker}
    </div>
  ) : (
    <div aria-hidden="true" className="relative">
      {track}
    </div>
  )
}

interface NutrientCardProps {
  readonly nutrient: NutrientDef
  /** null = món chưa có dữ liệu chất này: hiện "—" thay vì 0 (0 nghĩa là biết bằng 0) và thanh rỗng. */
  readonly value: number | null
  readonly target: number | null
  /** Mốc tham chiếu cho chất chưa có mục tiêu (xem `NutrientBar`). */
  readonly reference?: number | null
  readonly tone: string
  /** Món đóng góp (chỉ calo/macro ở tab Today): undefined = thẻ không có phần này, null = có nhưng đang thu lại, mảng = đang mở. */
  readonly contributors?: readonly Contributor[] | null
  /** `row` (mặc định): hàng tên / số / % + thanh mảnh (chi tiết món, plate). `tile`: thẻ 2 cột thanh dày của Nutrition Overview. */
  readonly layout?: 'row' | 'tile'
  /** Kỳ hiện dưới tên ở thẻ `tile` ("Today", "1 Week"…). */
  readonly period?: string
  /** Thẻ `tile` chiếm cả hai cột (Calories). */
  readonly wide?: boolean
}

/**
 * Thẻ một chất (Nutrition Overview): tên bên trái, "đã ăn / mục tiêu đơn vị" ở giữa, phần trăm (hoặc "No Target") bên phải.
 * Chất có thanh thì vẽ thanh bên dưới; chất không có mục tiêu và không có thanh (Net, Starch…) chỉ hiện giá trị.
 * Contributors mở ra bằng hoạt ảnh trượt, liệt kê tối đa ba món hoặc "No contributors present".
 */
export function NutrientCard({
  nutrient,
  value,
  target,
  reference,
  tone,
  contributors,
  layout = 'row',
  period,
  wide = false,
}: NutrientCardProps) {
  const unit = nutrient.unit
  const showBar = nutrient.kind !== 'none'
  const amount = value ?? 0
  const known = value !== null
  const percent =
    known && target !== null && target > 0 ? Math.round((amount / target) * 100) : null
  const barTone = MACRO_BAR[nutrient.key] ?? tone
  const open = contributors !== undefined && contributors !== null
  const contributorList = contributors !== undefined && (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden" inert={!open}>
        <div className="border-foreground/10 mt-3 border-t pt-3">
          <p className="flex items-center justify-between text-base font-semibold">
            Top 3 Contributors
            <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
          </p>
          {/* Không phụ thuộc `open`: khi đang co lại danh sách vẫn còn đó, không nháy sang "No contributors" */}
          {contributors?.length ? (
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              {contributors.map((item) => (
                <li key={item.name} className="flex justify-between gap-3">
                  <span className="truncate">{item.name}</span>
                  <span className="tabular-nums">
                    {formatAmount(item.value, unit)} {unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">No contributors present</p>
          )}
        </div>
      </div>
    </div>
  )

  // Thẻ của Nutrition Overview như MacroFactor: tên + kỳ, thanh dày (chất không có mục tiêu chừa chỗ trống), vạch kẻ, số lớn + mũi tên
  if (layout === 'tile')
    return (
      <li className={cn('bg-card flex flex-col rounded-xl px-4 pt-4 pb-3', wide && 'col-span-2')}>
        <p className="truncate text-xl leading-tight">{displayName(nutrient)}</p>
        <p className="text-muted-foreground text-base">{period}</p>
        <div className="mt-3 mb-3 h-6">
          {showBar && (
            <NutrientBar
              kind={nutrient.kind}
              value={amount}
              target={target}
              reference={reference}
              tone={barTone}
            />
          )}
        </div>
        <div className="border-foreground/10 mt-auto flex items-center justify-between border-t pt-3">
          <span className="tabular-nums">
            <span className="text-2xl">{known ? formatAmount(amount, unit) : '—'}</span>{' '}
            <span className="text-muted-foreground text-lg">{unit}</span>
          </span>
          <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
        </div>
        {contributorList}
      </li>
    )

  return (
    <li className="bg-card rounded-xl px-4 py-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-base">
        <span className="min-w-0 truncate">{displayName(nutrient)}</span>
        <span className="text-center tabular-nums">
          {target !== null
            ? `${known ? formatAmount(amount, unit) : '—'} / ${formatAmount(target, unit)} ${unit}`
            : known
              ? `${formatAmount(amount, unit)} ${unit}`
              : '—'}
        </span>
        <span className="text-muted-foreground text-right tabular-nums">
          {percent !== null ? `${percent}%` : target === null ? 'No Target' : ''}
        </span>
      </div>
      {showBar && (
        <div className="mt-3">
          <NutrientBar
            kind={nutrient.kind}
            value={amount}
            target={target}
            reference={reference}
            tone={barTone}
            thin
          />
        </div>
      )}
      {contributorList}
    </li>
  )
}
