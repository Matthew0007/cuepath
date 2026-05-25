interface AvatarImageProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}

export function AvatarImage({ src, name, size = 32, className = '' }: AvatarImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? '프로필'}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      className={`rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 ${className}`}
    >
      👤
    </div>
  )
}
