'use client'

import { SheetFrame } from '@/components/shared/SheetFrame'
import { BODY_FAT_BANDS } from '@/features/onboarding/types/onboarding-options.types'

export type ReferenceBody = 'female' | 'male'

interface BodyFatReferenceSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Bộ hình theo giới tính trong hồ sơ; mặc định nam. */
  readonly body?: ReferenceBody
  /** Chọn một khoảng: trả về % mỡ giữa khoảng (50%+ là 53). */
  readonly onSelect: (percent: number) => void
}

/**
 * Thân người xám tự vẽ (không dùng hình của MacroFactor): eo/bụng rộng dần theo mức mỡ, cơ bụng rõ ở 3 mức đầu,
 * rốn và nếp bụng ở mức cao. Nữ có áo thể thao trắng, nam có đường ngực.
 */
function Torso({ level, body }: { readonly level: number; readonly body: ReferenceBody }) {
  const female = body === 'female'
  const shoulder = female ? 26 : 30
  const waist = (female ? 11 : 13) + level * (female ? 2.4 : 2.6)
  const hip = (female ? 19 : 17) + level * (female ? 1.9 : 1.8)
  const belly = level >= 4 ? (level - 3) * 1.8 : 0
  const x = (offset: number) => 50 + offset
  // Cổ → vai → nách → eo → bụng → hông (trái), rồi ngược lại bên phải
  const torso = [
    `M${x(-7)} 4 Q${x(2 - shoulder)} 6 ${x(-shoulder)} 16 L${x(4 - shoulder)} 32`,
    `C${x(6 - shoulder)} 46 ${x(-waist)} 54 ${x(-waist)} 66`,
    `C${x(-waist - belly)} 76 ${x(-hip)} 88 ${x(-hip)} 104 L${x(hip)} 104`,
    `C${x(hip)} 88 ${x(waist + belly)} 76 ${x(waist)} 66`,
    `C${x(waist)} 54 ${x(shoulder - 6)} 46 ${x(shoulder - 4)} 32`,
    `L${x(shoulder)} 16 Q${x(shoulder - 2)} 6 ${x(7)} 4 Z`,
  ].join(' ')
  const arm = (sign: -1 | 1) => {
    const x = 50 + sign * shoulder
    return `M${x} 16 C${x + sign * 8} 18 ${x + sign * 9} 60 ${x + sign * 7} 104 L${x + sign} 104 C${x + sign * 2} 70 ${x} 40 ${x} 16 Z`
  }
  return (
    <svg viewBox="0 0 100 104" aria-hidden="true" className="w-full">
      <path d={arm(-1)} className="fill-zinc-500" />
      <path d={arm(1)} className="fill-zinc-500" />
      <path d={torso} className="fill-zinc-400" />
      {female ? (
        <path
          d={`M${50 - shoulder + 4} 22 Q50 16 ${50 + shoulder - 4} 22 L${50 + shoulder - 5} 42 Q50 ${46 + level * 0.5} ${50 - shoulder + 5} 42 Z`}
          className="fill-zinc-100"
        />
      ) : (
        <path
          d={`M${50 - shoulder + 6} 38 Q${50 - 10} ${44 + level * 0.8} 50 38 Q${50 + 10} ${44 + level * 0.8} ${50 + shoulder - 6} 38`}
          fill="none"
          strokeWidth="1.4"
          className="stroke-zinc-600"
        />
      )}
      {level <= 2 && (
        <g fill="none" strokeWidth="1.3" strokeLinecap="round" className="stroke-zinc-600">
          <path d="M50 52V88" opacity={1 - level * 0.25} />
          {[58, 67, 76].map((y) => (
            <path key={y} d={`M${44 + level} ${y}H${56 - level}`} opacity={1 - level * 0.3} />
          ))}
        </g>
      )}
      {level >= 3 && <ellipse cx="50" cy="86" rx="1.4" ry="1.8" className="fill-zinc-600" />}
      {level >= 5 && (
        <path
          d={`M${50 - waist} 92 Q50 ${96 + level} ${50 + waist} 92`}
          fill="none"
          strokeWidth="1.3"
          className="stroke-zinc-600"
        />
      )}
      <path
        d={`M${50 - hip} 96 Q50 100 ${50 + hip} 96 L${50 + hip} 104 L${50 - hip} 104 Z`}
        className="fill-zinc-100"
      />
    </svg>
  )
}

/** Bảng "Reference" của Visual Body Fat: lưới 3×3 hình thân theo khoảng % mỡ; chọn một ô thì điền % giữa khoảng và đóng. */
export function BodyFatReferenceSheet({
  open,
  onOpenChange,
  body = 'male',
  onSelect,
}: BodyFatReferenceSheetProps) {
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Reference" showDone={false} tall>
      <ul className="grid grid-cols-3 gap-3 p-4">
        {BODY_FAT_BANDS.map((band, index) => (
          <li key={band.value}>
            <button
              type="button"
              aria-label={`${band.label}: ${band.description}`}
              onClick={() => {
                onSelect(band.midPercent)
                onOpenChange(false)
              }}
              className="focus-visible:ring-ring/50 relative flex w-full flex-col items-center overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900 px-1 pt-2 pb-5 transition-transform duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
            >
              <Torso level={index} body={body} />
              <span className="absolute bottom-1 rounded-md border-2 border-zinc-600 bg-zinc-900 px-1.5 text-sm font-medium text-white tabular-nums">
                {band.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </SheetFrame>
  )
}
