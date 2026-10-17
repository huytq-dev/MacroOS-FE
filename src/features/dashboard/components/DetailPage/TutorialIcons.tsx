type IconProps = { readonly className?: string }

/** Biểu tượng tự vẽ cho thẻ hướng dẫn (lucide không có hình tương ứng với MacroFactor). */
export const TUTORIAL_ICON = 'size-6 shrink-0'

export const KeyIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M7 8a4 4 0 1 0 3.87 5H14v2.5h3V13h2.5v-2h-8.63A4 4 0 0 0 7 8Zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
  </svg>
)

export const DialIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    {[3, 12, 21].flatMap((x) =>
      [3, 9, 15].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" />)
    )}
    <circle cx="12" cy="21" r="1.9" />
  </svg>
)

export const SparkChartIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M2.5 18 8 11l4 4 5-6" />
    <path d="M18 3v4M16 5h4M21 12v3M19.5 13.5h3" strokeWidth="1.6" />
  </svg>
)

/** Cân điện tử: khối vuông bo góc, mặt đồng hồ khoét rỗng nên ăn theo màu nền phía sau. */
export const ScaleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path
      fillRule="evenodd"
      d="M6.500 3h11A3.500 3.500 0 0 1 21 6.500v11a3.500 3.500 0 0 1-3.500 3.500h-11A3.500 3.500 0 0 1 3 17.500v-11A3.500 3.500 0 0 1 6.500 3ZM12 5.900a3.600 3.600 0 1 0 0 7.200 3.600 3.600 0 0 0 0-7.200Z"
    />
    <path d="M10.400 9.500h3.200" stroke="currentColor" strokeWidth="1.600" strokeLinecap="round" />
  </svg>
)

/** Người ngồi thiền (Maintaining Peace of Mind). */
export const MeditationIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <circle cx="12" cy="4.5" r="2.2" />
    <path d="M12 8c-2.2 0-3.7 1.4-4.3 3.4L6.8 14H3v2.2c2 .1 4.6.5 6.2 1.8h5.8c1.6-1.3 4.2-1.7 6.2-1.8V14h-3.8l-.9-2.6C15.7 9.4 14.2 8 12 8Z" />
    <path d="M7 19.5h10v1.8H7z" />
  </svg>
)

/** Vòng xoáy đồng tâm (Informing Smarter Programs). */
export const SpiralIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-9-9" />
    <circle cx="12" cy="12" r="4.8" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
)

/** Thác nước: hai cột nhỏ nổi dần lên rồi một cột cao (Exploring the Waterfall). */
export const WaterfallIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <rect x="2" y="14" width="3" height="3" rx="0.5" />
    <rect x="8" y="8" width="3" height="3" rx="0.5" />
    <rect x="15" y="4" width="4" height="16" rx="1" />
  </svg>
)

/** Biểu tượng trắng tròn, hình bên trong màu nền thẻ (như vòng tròn trong MacroFactor). */
export const TutorialDisc = ({ children }: { readonly children: React.ReactNode }) => (
  <span className="bg-foreground text-background flex size-6 items-center justify-center rounded-full">
    {children}
  </span>
)
