import {
  Calendar1,
  CalendarDays,
  Camera,
  Grip,
  Images,
  PersonStanding,
  Settings,
} from 'lucide-react'
import {
  ScaleIcon,
  SparkChartIcon,
  TUTORIAL_ICON,
  type TutorialStep,
} from '@/features/dashboard/components/DetailPage'

export const SCALE_WEIGHT_TUTORIAL: readonly TutorialStep[] = [
  {
    icon: <ScaleIcon className={TUTORIAL_ICON} />,
    title: 'Scale Weight',
    text: 'On the Scale Weight page, you can track your Scale Weight over time, and add or edit weight entries.',
  },
  {
    icon: <CalendarDays aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Logging Past Days',
    text: 'Tap + to log today, or tap the date at the top of the entry sheet to log a weigh-in for an earlier day.',
  },
  {
    icon: <SparkChartIcon className={TUTORIAL_ICON} />,
    title: 'Looking for the Signal?',
    text: 'Day-to-day weight is noisy. Weight Trend on the Dashboard smooths it out so real changes stand out.',
  },
]

/** Hướng dẫn 6 bước của các trang số đo cơ thể (Visual Body Fat, Neck…Ankle), như MacroFactor. */
export const MEASUREMENT_TUTORIAL: readonly TutorialStep[] = [
  {
    icon: <PersonStanding aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Tracking Your Progress',
    text: 'Progress photos and body measurements can be a useful tool for tracking your progress.',
  },
  {
    icon: <Settings aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Configuration',
    text: 'We recommend focusing on a handful of metrics that you can track consistently.',
  },
  {
    icon: <Calendar1 aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Measurement Frequency',
    text: 'Taking measurements once a week (or even once a month) is sufficient for most goals.',
  },
  {
    icon: <Grip aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Metric Focus',
    text: 'You can swap the metric in focus by using the selector above the chart.',
  },
  {
    icon: <Images aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Photo Gallery',
    text: 'After you take your first progress photo, gallery view will become available below.',
  },
  {
    icon: <Camera aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Before & After',
    text: 'You can use the gallery to view and compare your photos and metrics over time.',
  },
]
