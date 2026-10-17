import type { Metadata } from 'next'
import { OnboardingPage } from '@/features/onboarding/pages/OnboardingPage'

export const metadata: Metadata = { title: 'Set up' }

export default function OnboardingRoute() {
  return <OnboardingPage />
}
