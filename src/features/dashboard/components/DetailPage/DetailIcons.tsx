type IconProps = { readonly className?: string }

/** Nút icon của Button ép svg về size-4 trừ khi svg tự có class size-*; icon biểu đồ cần 24px như MacroFactor. */
const BUTTON_ICON = 'size-6'

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Phóng to biểu đồ: thanh trên, mũi tên hai đầu thẳng đứng, thanh dưới (như MacroFactor). */
export const ExpandChartIcon = ({ className = BUTTON_ICON }: IconProps) => (
  <svg viewBox="0 0 24 24" {...STROKE} aria-hidden="true" className={className}>
    <path d="M7 3.5h10M7 20.5h10M12 7.5v9M9 10.5l3-3 3 3M9 13.5l3 3 3-3" />
  </svg>
)

/** Thu nhỏ biểu đồ: hai mũi tên chụm vào hai vạch ngang ở giữa. */
export const CollapseChartIcon = ({ className = BUTTON_ICON }: IconProps) => (
  <svg viewBox="0 0 24 24" {...STROKE} aria-hidden="true" className={className}>
    <path d="M6.5 10.8h11M6.5 13.2h11M12 3v5M9.5 5.8l2.5 2.5 2.5-2.5M12 21v-5M9.5 18.2l2.5-2.5 2.5 2.5" />
  </svg>
)

/** Chấm tròn đặc có hai vạch "tạm dừng" khoét theo màu nền thẻ: trạng thái "Waiting" chưa đủ dữ liệu. */
export const WaitingIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
    <circle cx="10" cy="10" r="10" fill="currentColor" />
    <rect x="6.8" y="5.8" width="2.2" height="8.4" rx="0.6" className="fill-card" />
    <rect x="11" y="5.8" width="2.2" height="8.4" rx="0.6" className="fill-card" />
  </svg>
)
