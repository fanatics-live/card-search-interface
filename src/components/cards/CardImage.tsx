import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface CardImageProps {
  src?: string
  alt: string
  className?: string
  priority?: boolean // Load eagerly for first row
}

export function CardImage({ src, alt, className, priority = false }: CardImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const placeholderSrc = 'https://via.placeholder.com/300x400/e5e7eb/9ca3af?text=No+Image'

  return (
    <div className={cn('relative w-full aspect-[3/4] bg-gray-100 overflow-hidden', className)}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 skeleton" />
      )}

      <img
        src={hasError ? placeholderSrc : (src || placeholderSrc)}
        alt={alt}
        className={cn(
          'w-full h-full object-contain transition-opacity duration-150',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true)
          setIsLoaded(true)
        }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  )
}
