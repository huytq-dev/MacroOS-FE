'use client'

import { useId, type ReactNode } from 'react'
import type { OptionIcon } from '../../types/onboarding-options.types'

interface SolidProps {
  readonly className?: string
  readonly children: ReactNode
  /** Phần khoét lõm khỏi hình đặc (vẽ màu đen trong mask). */
  readonly cut?: ReactNode
  /** Phần vẽ đè lên sau khi khoét (không bị khoét). */
  readonly overlay?: ReactNode
}

/** Khung icon đặc kiểu MacroFactor: hình đặc theo màu chữ, chi tiết bên trong được khoét lõm bằng mask. */
export function Solid({ className, children, cut, overlay }: SolidProps) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <mask id={id}>
        <rect width="24" height="24" fill="white" />
        {cut}
      </mask>
      <g mask={`url(#${id})`}>{children}</g>
      {overlay}
    </svg>
  )
}

const BLACK = { fill: 'black' } as const

function calendar(cut: ReactNode): OptionIcon {
  return function CalendarIcon({ className }) {
    return (
      <Solid
        className={className}
        cut={
          <>
            <rect x="3" y="9.6" width="18" height="1.4" {...BLACK} />
            {cut}
          </>
        }
      >
        <rect x="3" y="4.5" width="18" height="16.5" rx="2.6" />
        <rect x="7" y="2" width="2.2" height="4.5" rx="1.1" />
        <rect x="14.8" y="2" width="2.2" height="4.5" rx="1.1" />
      </Solid>
    )
  }
}

/** Lịch trống: 0 buổi / tuần. */
export const CalendarZero = calendar(null)
/** Lịch một chấm: 1–3 buổi. */
export const CalendarOne = calendar(<circle cx="12" cy="15.6" r="1.9" {...BLACK} />)
/** Lịch ba chấm: 4–6 buổi. */
export const CalendarThree = calendar(
  <>
    <circle cx="7.8" cy="15.6" r="1.3" {...BLACK} />
    <circle cx="12" cy="15.6" r="1.3" {...BLACK} />
    <circle cx="16.2" cy="15.6" r="1.3" {...BLACK} />
  </>
)
/** Lịch nhiều dòng: 7+ buổi. */
export const CalendarMany = calendar(
  <>
    <rect x="7" y="13" width="10" height="1.8" rx=".9" {...BLACK} />
    <rect x="7" y="16.6" width="10" height="1.8" rx=".9" {...BLACK} />
  </>
)

function experience(bars: number): OptionIcon {
  return function ExperienceIcon({ className }) {
    return (
      <Solid
        className={className}
        cut={
          <>
            {bars >= 1 && <rect x="7.2" y="14.2" width="2.2" height="2.4" rx=".6" {...BLACK} />}
            {bars >= 2 && <rect x="10.9" y="11.8" width="2.2" height="4.8" rx=".6" {...BLACK} />}
            {bars >= 3 && <rect x="14.6" y="9.2" width="2.2" height="7.4" rx=".6" {...BLACK} />}
          </>
        }
      >
        <circle cx="12" cy="12" r="10" />
      </Solid>
    )
  }
}

/** Vòng tròn đặc với 0–3 thanh tăng dần: mức kinh nghiệm. */
export const ExperienceNone = experience(0)
export const ExperienceBeginner = experience(1)
export const ExperienceIntermediate = experience(2)
export const ExperienceAdvanced = experience(3)

/** Huy hiệu tròn đặc có ngôi sao: sàn calo tiêu chuẩn. */
export function BadgeStar({ className }: { readonly className?: string }) {
  return (
    <Solid
      className={className}
      cut={
        <polygon
          points="12,6 13.8,10 18.2,10.4 14.9,13.3 15.9,17.6 12,15.3 8.1,17.6 9.1,13.3 5.8,10.4 10.2,10"
          {...BLACK}
        />
      }
    >
      <circle cx="12" cy="12" r="10" />
    </Solid>
  )
}

/** Huy hiệu tròn đặc có dấu chấm than: cảnh báo, sàn calo thấp. */
export function BadgeAlert({ className }: { readonly className?: string }) {
  return (
    <Solid
      className={className}
      cut={
        <>
          <rect x="11" y="6.4" width="2" height="7.4" rx="1" {...BLACK} />
          <circle cx="12" cy="17" r="1.2" {...BLACK} />
        </>
      }
    >
      <circle cx="12" cy="12" r="10" />
    </Solid>
  )
}

/** Huy hiệu tròn đặc có chữ i: ô giải thích. */
export function BadgeInfo({ className }: { readonly className?: string }) {
  return (
    <Solid
      className={className}
      cut={
        <>
          <circle cx="12" cy="7.6" r="1.3" {...BLACK} />
          <rect x="11" y="10.4" width="2" height="7" rx="1" {...BLACK} />
        </>
      }
    >
      <circle cx="12" cy="12" r="10" />
    </Solid>
  )
}

function scale(sign: 'minus' | 'plus' | null): OptionIcon {
  return function ScaleIcon({ className }) {
    return (
      <Solid
        className={className}
        cut={
          <>
            <circle cx="12" cy="8.6" r="2.1" {...BLACK} />
            {sign && <circle cx="19" cy="19" r="6" {...BLACK} />}
          </>
        }
        overlay={
          sign && (
            <>
              <rect x="15.6" y="18" width="6.8" height="2" rx="1" />
              {sign === 'plus' && <rect x="18" y="15.6" width="2" height="6.8" rx="1" />}
            </>
          )
        }
      >
        <rect x="3" y="3" width="18" height="18" rx="3.5" />
      </Solid>
    )
  }
}

/** Ô cân đặc (mặt số khoét lõm): giảm cân (−), giữ cân, tăng cân (+). */
export const ScaleLose = scale('minus')
export const ScaleKeep = scale(null)
export const ScaleGain = scale('plus')
