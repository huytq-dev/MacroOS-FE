import { Microscope, Puzzle, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { TUTORIAL_ICON, WaterfallIcon, type TutorialStep } from '../DetailPage'

export const GOAL_PROGRESS_TUTORIAL: readonly TutorialStep[] = [
  {
    icon: <SlidersHorizontal aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Supporting Your Goals',
    text: 'MacroOS continuously makes calorie and macro adjustments to keep you on track.',
  },
  {
    icon: <TrendingUp aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Visualizing Your Goal Progress',
    text: 'Goal Progress displays your current goal, how far you’ve come, and how far you have left to go.',
  },
  {
    icon: <Puzzle aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Falling Into Place',
    text: 'Goal Progress page shows your incremental weight progress in a waterfall chart.',
  },
  {
    icon: <Microscope aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Interpreting the Chart 1/2',
    text: 'The leftmost bar shows the size of your initial goal.',
  },
  {
    icon: <Microscope aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Interpreting the Chart 2/2',
    text: 'The rightmost bar shows your distance from achieving your goal.',
  },
  {
    icon: <WaterfallIcon className={TUTORIAL_ICON} />,
    title: 'Exploring the Waterfall',
    text: 'The middle bars show weight changes, with shades indicating progress toward or away from your goal.',
  },
]
