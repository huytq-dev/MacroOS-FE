import { BrainCog, Lightbulb } from 'lucide-react'
import {
  MeditationIcon,
  ScaleIcon,
  SparkChartIcon,
  SpiralIcon,
  TUTORIAL_ICON,
  type TutorialStep,
} from '../DetailPage'

export const WEIGHT_TREND_TUTORIAL: readonly TutorialStep[] = [
  {
    icon: <Lightbulb aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'What is Weight Trend?',
    text: 'Scale Weight data tends to be quite noisy. Your Weight Trend is the signal in all of that noise.',
  },
  {
    icon: <ScaleIcon className={TUTORIAL_ICON} />,
    title: 'Why is Scale Weight Noisy?',
    text: 'Your Scale Weight can fluctuate due to total body water, gastrointestinal content, and other factors.',
  },
  {
    icon: <BrainCog aria-hidden="true" fill="currentColor" className={TUTORIAL_ICON} />,
    title: 'Why use Weight Trend?',
    text: 'It highlights meaningful changes in weight, free from large swings due to transient weight fluctuations.',
  },
  {
    icon: <SparkChartIcon className={TUTORIAL_ICON} />,
    title: 'How Does it Work?',
    text: 'Your daily weight is analyzed in context of your trend over time to determine your Weight Trend.',
  },
  {
    icon: <SpiralIcon className={TUTORIAL_ICON} />,
    title: 'Informing Smarter Programs',
    text: 'Trend Weight ensures smarter calorie adjustments that don’t overreact to weight fluctuations.',
  },
  {
    icon: <MeditationIcon className={TUTORIAL_ICON} />,
    title: 'Maintaining Peace of Mind',
    text: 'If day-to-day fluctuations stress you out, follow the trend. It better reflects actual weight changes.',
  },
]
