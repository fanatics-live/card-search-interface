import { cn } from '@/lib/utils/cn'

interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-white rounded-lg border border-gray-200 overflow-hidden',
            className
          )}
        >
          {/* Image skeleton */}
          <div className="w-full aspect-[3/4] skeleton" />

          <div className="p-4 space-y-3">
            {/* Grade badge skeleton */}
            <div className="w-20 h-6 skeleton rounded" />

            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="w-full h-4 skeleton rounded" />
              <div className="w-3/4 h-4 skeleton rounded" />
            </div>

            {/* Price skeleton */}
            <div className="w-24 h-6 skeleton rounded" />

            {/* Metadata skeleton */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-4 skeleton rounded" />
              <div className="w-16 h-4 skeleton rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function CardGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <CardSkeleton count={count} />
    </div>
  )
}
