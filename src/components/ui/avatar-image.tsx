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

  const initial = name ? name.charAt(0).toUpperCase() : '?'
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center shrink-0 text-white font-bold ${className}`}
    >
      {initial}
    </div>
  )
}
