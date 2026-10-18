type IconProps = { readonly className?: string }

const BASE = { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const

/** Tài liệu đặc có ba dòng khoét (Nutrition Overview). */
export const OverviewIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path
      fillRule="evenodd"
      d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2.5 5v1.5h7V8h-7Zm0 3.5V13h7v-1.5h-7Zm0 3.5v1.5H13V15H8.5Z"
    />
  </svg>
)

/** Hai tờ chồng nhau đặc (Copy Day). */
export const CopyDayIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M8 2h11a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
    <path d="M4 6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-1H7a2 2 0 0 1-2-2V6H4Z" />
  </svg>
)

/** Vòng tròn đặc có dấu ✓ khoét (Select All). */
export const SelectAllIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.7 7.3a1 1 0 0 1 0 1.4l-5.5 5.5a1 1 0 0 1-1.4 0l-2.5-2.5a1 1 0 1 1 1.4-1.4l1.8 1.8 4.8-4.8a1 1 0 0 1 1.4 0Z"
    />
  </svg>
)

/** Thùng rác đặc có hai vạch khoét (Clear Day). */
export const ClearDayIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path
      fillRule="evenodd"
      d="M9 3h6l1 2h4v2H4V5h4l1-2ZM5.5 9h13l-1 11a1 1 0 0 1-1 .9H7.5a1 1 0 0 1-1-.9L5.5 9ZM9.5 11v7h1.5v-7H9.5Zm3.5 0v7h1.5v-7H13Z"
    />
  </svg>
)

/** Vòng tròn đặc có mũi tên lên khoét (Hide Food Details). */
export const HideDetailsIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 6.5a1 1 0 0 1 .7.3l4 4a1 1 0 0 1-1.4 1.4L12 10.9l-3.3 3.3a1 1 0 0 1-1.4-1.4l4-4a1 1 0 0 1 .7-.3Z"
    />
  </svg>
)

/** Đồng hồ cát đặc (Hide Empty Hours). */
export const HideEmptyHoursIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M6 2h12v2h-1v3.2a3 3 0 0 1-1 2.2L13.2 12l1.8 1.6a3 3 0 0 1 1 2.2V20h1v2H6v-2h1v-4.2a3 3 0 0 1 1-2.2L10.8 12 9 10.4a3 3 0 0 1-1-2.2V4H6V2Z" />
  </svg>
)
