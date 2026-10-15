'use client'

import { useAuth } from '@/features/auth/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-base font-semibold">Dashboard</h1>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Xin chào, {user?.name || user?.email}</CardTitle>
          <CardDescription>Chưa có dữ liệu. Các màn hình nghiệp vụ sẽ thêm sau.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}
