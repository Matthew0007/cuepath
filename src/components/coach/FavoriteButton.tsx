'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toggleFavorite } from '@/app/(main)/coaches/favorites-actions'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  coachId: string
  initialFavorited: boolean
  className?: string
}

export function FavoriteButton({ coachId, initialFavorited, className }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [pending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = !favorited
    setFavorited(next) // optimistic
    startTransition(() => toggleFavorite(coachId, favorited))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
        favorited
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-300 hover:text-red-400 hover:bg-red-50',
        className,
      )}
    >
      <Heart className={cn('w-4 h-4', favorited && 'fill-current')} />
    </button>
  )
}
