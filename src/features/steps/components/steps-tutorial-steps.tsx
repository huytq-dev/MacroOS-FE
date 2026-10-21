import { Download, Footprints, HeartPulse, Mountain, Smartphone, TrendingUp } from 'lucide-react'
import { TUTORIAL_ICON, type TutorialStep } from '@/features/dashboard/components/DetailPage'

/** Hướng dẫn trang Steps (6 bước, lời riêng của MacroOS): ý tưởng theo MacroFactor, không dùng số liệu thống kê chưa có nguồn. */
export const STEPS_TUTORIAL: readonly TutorialStep[] = [
  {
    icon: <Footprints aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Daily Step Count',
    text: 'Your step count is how many steps you take in a day. It is a simple way to see how much you move outside of workouts.',
  },
  {
    icon: <Download aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Importing Step Data',
    text: 'Syncing steps from a phone or watch is not available yet. For now, type in a day’s total yourself.',
  },
  {
    icon: <Smartphone aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Tracking Your Steps',
    text: 'Tap + to add a day, or tap the pencil next to a day to correct it. Saving the same day again replaces the old number.',
  },
  {
    icon: <HeartPulse aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Activity is Crucial for Health',
    text: 'Moving regularly supports your heart, your mood and your sleep, and walking is one of the easiest habits to build on.',
  },
  {
    icon: <Mountain aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'The Benefits of Walking More',
    text: 'More walking means more energy burned and it is gentle on your joints. Short walks after meals or on breaks add up too.',
  },
  {
    icon: <TrendingUp aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Every Extra Step Helps',
    text: 'Whatever your goal, a little more movement than yesterday is progress. Small, steady increases are the easiest to keep.',
  },
]
