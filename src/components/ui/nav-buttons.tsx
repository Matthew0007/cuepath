'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NavButtons() {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
        홈화면
      </Link>
      <button
        type="button"
        onClick={() => router.back()}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
      >
        이전화면
      </button>
    </div>
  )
}
