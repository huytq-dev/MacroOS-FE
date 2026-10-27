import { Mountain } from 'lucide-react'
import type { expLegend } from '../../expenditure-series'

type Legend = ReturnType<typeof expLegend>

const ITEM = 'flex items-center gap-2'

/** Đường + ký hiệu: vòng tròn rỗng (Updating) hoặc ô vuông rỗng (Holding / Initial), như chú giải của MacroFactor. */
function LineKey({
  shape,
  faded = false,
}: {
  readonly shape: 'circle' | 'square' | null
  readonly faded?: boolean
}) {
  return (
    <span aria-hidden="true" className="relative flex h-4 w-6 items-center">
      <span className="bg-mf-tile-protein h-0.5 w-full" />
      {shape === 'circle' && (
        <span className="border-mf-tile-protein bg-card absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2" />
      )}
      {shape === 'square' && (
        <span
          className={`bg-card absolute left-1/2 size-2.5 -translate-x-1/2 border-2 ${faded ? 'border-mf-tile-protein/70' : 'border-mf-tile-protein'}`}
        />
      )}
    </span>
  )
}

/**
 * Chú giải dưới biểu đồ, thứ tự như ảnh MacroFactor / ảnh minh hoạ của user: Flux Range, Updating (vòng tròn), Holding (ô vuông), Initial estimate (ô vuông, ngày Calibrating). Chỉ liệt kê
 * lớp ĐANG vẽ trong khung; "Flux Range" CHỈ khi khung có dải hợp lệ (BE trả, và bản build bật). Không có ngày nào có marker (nhóm W / M lẫn trạng thái) thì chỉ còn "Expenditure".
 */
export function ExpenditureLegend({
  legend,
  fluxLabel = 'Flux Range',
}: {
  readonly legend: Legend
  /** "MacroOS Flux V1 (preview, unapproved)" khi BE báo bản xem trước. */
  readonly fluxLabel?: string
}) {
  const states = legend.updating || legend.holdingDays || legend.calibrating
  return (
    <div
      aria-label="Chart legend"
      className="bg-card text-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl px-3 py-4 text-base min-[360px]:gap-x-6"
    >
      {legend.flux && (
        <span className={ITEM}>
          <Mountain
            aria-hidden="true"
            data-flux-legend=""
            className="text-mf-flux-band fill-mf-flux-band/50 size-4"
          />
          {fluxLabel}
        </span>
      )}
      {legend.updating && (
        <span className={ITEM}>
          <LineKey shape="circle" />
          Updating
        </span>
      )}
      {legend.holdingDays && (
        <span className={ITEM}>
          <LineKey shape="square" faded />
          Holding
        </span>
      )}
      {legend.calibrating && (
        <span className={ITEM}>
          <LineKey shape="square" />
          Initial estimate
        </span>
      )}
      {legend.line && !states && (
        <span className={ITEM}>
          <LineKey shape={null} />
          Expenditure
        </span>
      )}
    </div>
  )
}
