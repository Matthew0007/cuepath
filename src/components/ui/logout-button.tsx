'use client'

import { Button } from '@/components/ui/button'
import { logout } from '@/app/(auth)/actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        로그아웃
      </Button>
    </form>
  )
}
