import { AuthGuard } from '@/features/auth/components/AuthGuard'

// Wizard thiết lập chạy toàn màn hình: không sidebar, không thanh tab, chỉ cần đã đăng nhập.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="bg-background text-foreground min-h-dvh">{children}</div>
    </AuthGuard>
  )
}
