'use client'

import { Solid } from './SolidIcons'

interface IconProps {
  readonly className?: string
}

const BLACK = { fill: 'black' } as const
const CUT_STROKE = { fill: 'none', stroke: 'black', strokeLinecap: 'round' } as const

/** Thẻ giá có trái tim: nguồn affiliate. */
export function AffiliateTag({ className }: IconProps) {
  return (
    <Solid
      className={className}
      cut={
        <>
          <circle cx="7.6" cy="7.6" r="1.3" {...BLACK} />
          <path d="M12.6 16.4l-2.6-2.5a1.8 1.8 0 0 1 2.6-2.4 1.8 1.8 0 0 1 2.6 2.4z" {...BLACK} />
        </>
      }
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    </Solid>
  )
}

/** Ngôi sao có mặt cười: nguồn "bạn bè giới thiệu". */
export function FriendStar({ className }: IconProps) {
  return (
    <Solid
      className={className}
      cut={
        <>
          <circle cx="10" cy="11.2" r=".9" {...BLACK} />
          <circle cx="14" cy="11.2" r=".9" {...BLACK} />
          <path d="M10 14.2c1.2 1.1 2.8 1.1 4 0" strokeWidth="1.2" {...CUT_STROKE} />
        </>
      }
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </Solid>
  )
}

/** Nút phát trong khung bo tròn: YouTube. */
export function YoutubeLogo({ className }: IconProps) {
  return (
    <Solid className={className} cut={<polygon points="10,9.2 15.4,12 10,14.8" {...BLACK} />}>
      <rect x="2" y="5" width="20" height="14" rx="4.2" />
    </Solid>
  )
}

/** Khung vuông bo tròn, ống kính và chấm: Instagram. */
export function InstagramLogo({ className }: IconProps) {
  return (
    <Solid
      className={className}
      cut={
        <>
          <circle cx="12" cy="12" r="4" strokeWidth="2" {...CUT_STROKE} />
          <circle cx="17.2" cy="6.8" r="1.1" {...BLACK} />
        </>
      }
    >
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
    </Solid>
  )
}

/** Khung vuông bo tròn với chữ f: Facebook. */
export function FacebookLogo({ className }: IconProps) {
  return (
    <Solid
      className={className}
      cut={
        <path
          d="M16.2 8.2h-1.6c-1 0-1.6.6-1.6 1.6V12h3.1l-.5 2.8H13V21"
          strokeWidth="2"
          {...CUT_STROKE}
        />
      }
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
    </Solid>
  )
}

/** Đầu người ngoài hành tinh có ăng-ten: Reddit. */
export function RedditLogo({ className }: IconProps) {
  return (
    <Solid
      className={className}
      cut={
        <>
          <circle cx="8.8" cy="13.2" r="1.5" {...BLACK} />
          <circle cx="15.2" cy="13.2" r="1.5" {...BLACK} />
          <path d="M8.8 16.6c1 .9 2 1.2 3.2 1.2s2.2-.3 3.2-1.2" strokeWidth="1.2" {...CUT_STROKE} />
        </>
      }
    >
      <ellipse cx="12" cy="14.2" rx="9" ry="6.6" />
      <circle cx="3.4" cy="11.6" r="2.1" />
      <circle cx="20.6" cy="11.6" r="2.1" />
      <circle cx="17.6" cy="4" r="1.6" />
      <path
        d="M12 7.6L13.2 3.4L16.4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Solid>
  )
}

/** Nốt nhạc: TikTok. */
export function TiktokLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M13 3h3a4.7 4.7 0 0 0 4 4v3a7.5 7.5 0 0 1-4-1.3V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.8V3z" />
    </svg>
  )
}
