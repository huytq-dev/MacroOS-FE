import type { Metadata } from 'next'
import { BmrEquationPage } from '@/features/more/pages/BmrEquationPage'

export const metadata: Metadata = { title: 'BMR Equation' }

export default function BmrEquationRoute() {
  return <BmrEquationPage />
}
