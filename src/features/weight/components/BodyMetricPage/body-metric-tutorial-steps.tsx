import { CalendarDays, Lightbulb, PersonStanding } from 'lucide-react'
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

export const VISUAL_BODY_FAT_TUTORIAL: readonly TutorialStep[] = [
  {
    icon: <PersonStanding aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Tracking Your Progress',
    text: 'Progress photos and body measurements can be a useful tool for tracking your progress.',
  },
  {
    icon: <Lightbulb aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Estimating Visually',
    text: 'Open Reference and pick the picture closest to how you look. Consistent lighting and timing matter more than precision.',
  },
]
