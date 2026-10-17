import {
  ArrowRightToLine,
  ArrowUpDown,
  Calculator,
  Grid2x2,
  Lightbulb,
  Play,
  Star,
  Watch,
} from 'lucide-react'
import {
  DialIcon,
  KeyIcon,
  SparkChartIcon,
  TUTORIAL_ICON,
  TutorialDisc,
  type TutorialStep,
} from '../DetailPage'

export const EXPENDITURE_TUTORIAL: readonly TutorialStep[] = [
  {
    icon: <KeyIcon className={TUTORIAL_ICON} />,
    title: 'The Key to Our Smart Programs',
    text: 'Your Expenditure provides the backbone of our dynamic and evidence-based coaching algorithms.',
  },
  {
    icon: <Lightbulb aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'What is Expenditure?',
    text: 'Expenditure is our running estimate of the total number of calories you burn each day.',
  },
  {
    icon: <Star aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Why Does it Matter?',
    text: 'Your Expenditure is used to calculate calorie targets to help you gain or lose weight at your desired rate.',
  },
  {
    icon: <Calculator aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'How is it Calculated?',
    text: 'Expenditure is calculated based on your nutrition data and your rate of weight gain or weight loss.',
  },
  {
    icon: <ArrowRightToLine aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Our Starting Estimate',
    text: 'It is based on validated equations, but it may be higher or lower than your true expenditure.',
  },
  {
    icon: <Grid2x2 aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Gathering More Data',
    text: 'MacroOS needs at least 4 days of logging in a week to start updating your expenditure estimate.',
  },
  {
    icon: <DialIcon className={TUTORIAL_ICON} />,
    title: 'Dialing It In',
    text: 'After 20-30 days of consistent tracking, you should have a refined, personalized Expenditure estimate.',
  },
  {
    icon: (
      <TutorialDisc>
        <ArrowUpDown aria-hidden="true" className="size-4" strokeWidth={2.5} />
      </TutorialDisc>
    ),
    title: 'Keeping Pace with Fluctuations',
    text: 'As your lifestyle, activity, and nutrition change, your Expenditure will update to reflect those changes.',
  },
  {
    icon: <Watch aria-hidden="true" className={TUTORIAL_ICON} />,
    title: 'Do I Need to Track Exercise?',
    text: 'Nope! Your weight and nutrition data give the algorithms all of the information they need.',
  },
  {
    icon: (
      <TutorialDisc>
        <Play aria-hidden="true" fill="currentColor" className="size-3.5 translate-x-px" />
      </TutorialDisc>
    ),
    title: 'Holding and Updating',
    text: 'Your Expenditure will update continuously when you consistently log data, and pause when you don’t.',
  },
  {
    icon: <SparkChartIcon className={TUTORIAL_ICON} />,
    title: 'Maintaining Continuous Updates',
    text: 'Continuous updates require 4 days of food logging and one day of weight logging per 7-day period.',
  },
]
