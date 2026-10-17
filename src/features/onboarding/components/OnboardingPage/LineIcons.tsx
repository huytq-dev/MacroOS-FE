'use client'

import type { ReactNode } from 'react'

interface IconProps {
  readonly className?: string
}

function Line({ className, children }: IconProps & { readonly children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

/** Dấu hỏi trơn (không khung tròn), như đáp án "Không chắc" của MacroFactor. */
export function QuestionMark({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M8.5 8.4a3.6 3.6 0 1 1 5.4 3.1c-1 .6-1.9 1.3-1.9 2.6" strokeWidth="2.4" />
      <path d="M12 18.4v.01" strokeWidth="2.8" />
    </Line>
  )
}

/** Người chạy kèm vạch tốc độ: cardio. */
export function Runner({ className }: IconProps) {
  return (
    <Line className={className}>
      <circle cx="15.5" cy="4.5" r="1.8" fill="currentColor" />
      <path d="M13 8.5l-3 4 3.2 2.2-1 4.6M10 12.5l-3-1M13 8.5l3.5 2.3 2.5-.8M13.2 14.7l3.3 2v3M2.5 8h4M1.5 12h4M3.5 16h3" />
    </Line>
  )
}

/** Người ngồi thiền: không tập hoặc vận động nhẹ. */
export function Meditator({ className }: IconProps) {
  return (
    <Line className={className}>
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <path d="M12 8.5v4.5M6.5 14.5c1.6-1 3.4-1.5 5.5-1.5s3.9.5 5.5 1.5M4 19c2.5-2.4 5-3.5 8-3.5s5.5 1.1 8 3.5c-2.5 1-5 1.5-8 1.5S6.5 20 4 19z" />
    </Line>
  )
}

/** Giày patin: "rất năng động". */
export function Skate({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7 3h4v7.2h5.6a3 3 0 0 1 2.6 1.5l1.3 2.3V16.5H6z" />
      <circle cx="8.4" cy="19.4" r="1.7" />
      <circle cx="12" cy="19.4" r="1.7" />
      <circle cx="15.6" cy="19.4" r="1.7" />
    </svg>
  )
}

/** Miếng bơ trên đĩa: chế độ ít béo. */
export function ButterDish({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M6 7.5h9.5l2.5 6H6z" />
      <rect x="3" y="16" width="18" height="2.6" rx="1.3" />
      <rect x="4.5" y="20" width="12" height="1.6" rx=".8" />
    </svg>
  )
}

/** Hai xiên thịt: mức protein rất cao. */
export function Skewers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <rect x="6.2" y="2" width="1.6" height="20" rx=".8" />
      <rect x="16.2" y="2" width="1.6" height="20" rx=".8" />
      {[6, 12, 17].map((y) => (
        <g key={y}>
          <circle cx="7" cy={y} r="2.6" />
          <circle cx="17" cy={y} r="2.6" />
        </g>
      ))}
    </svg>
  )
}

/** Ba chấm tròn chụm lại: phân tích vi chất. */
export function Bubbles({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <circle cx="9" cy="7.5" r="3.2" />
      <circle cx="16.4" cy="13" r="3.2" />
      <circle cx="8.2" cy="17.6" r="2.8" />
    </svg>
  )
}
