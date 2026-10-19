'use client'

import { CalendarCheck, LayoutGrid, ListFilter, Sparkles } from 'lucide-react'
import {
  FeatureCarouselStep,
  WizardShell,
  type CarouselSlide,
} from '@/features/onboarding/components/OnboardingPage'
import type { FlowDirection } from '@/stores/flow.store'

interface IntroModuleProps {
  readonly direction: FlowDirection
  readonly isSaving: boolean
  readonly onExit: () => void
  readonly onFinish: () => void
}

const SLIDES: readonly CarouselSlide[] = [
  {
    icon: Sparkles,
    title: 'Welcome to MacroOS',
    points: [
      'Your program adapts to you',
      'Here is how weekly check-ins keep your targets on track',
    ],
  },
  {
    icon: CalendarCheck,
    title: 'Weekly Check-ins',
    points: [
      'Once a week we review your logging',
      'We look at your weight trend and expenditure',
      'Then we update your Calorie and macro targets',
    ],
  },
  {
    icon: LayoutGrid,
    title: 'Coaching Modules',
    points: [
      'Each check-in is a few short modules',
      'Like marking incomplete days and reviewing your update',
    ],
  },
  {
    icon: ListFilter,
    title: 'Module Curation',
    points: [
      'We only show the modules you need',
      'Optional ones can be turned back on any time from More',
    ],
  },
]

/** Module Introduction: dùng lại carousel giới thiệu của wizard thiết lập (`FeatureCarouselStep`) với bốn slide về check-in; nút dưới là "Next Module". */
export function IntroModule({ direction, isSaving, onExit, onFinish }: IntroModuleProps) {
  return (
    <WizardShell
      sectionTitle="Introduction"
      progress={null}
      canGoBack
      onBack={onExit}
      stepKey="intro"
      direction={direction}
      nextLabel="Next Module"
      nextDisabled={false}
      isPending={isSaving}
      pendingLabel="Saving…"
      onNext={onFinish}
      error={null}
    >
      <FeatureCarouselStep slides={SLIDES} />
    </WizardShell>
  )
}
