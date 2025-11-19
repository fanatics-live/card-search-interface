import { cn } from '@/lib/utils/cn'

interface ValueBadgesProps {
  greatPrice?: boolean
  fanaticsAuthentic?: boolean
  hasOffers?: boolean
  className?: string
}

export function ValueBadges({
  greatPrice,
  fanaticsAuthentic,
  hasOffers,
  className,
}: ValueBadgesProps) {
  const badges = []

  if (greatPrice) {
    badges.push({
      label: 'Great Price',
      icon: '🔥',
      className: 'bg-value-great-price/10 text-value-great-price border-value-great-price/20',
    })
  }

  if (fanaticsAuthentic) {
    badges.push({
      label: 'Fanatics Authentic',
      icon: '✓',
      className: 'bg-green-100 text-green-700 border-green-200',
    })
  }

  if (hasOffers) {
    badges.push({
      label: 'Has Offers',
      icon: '💬',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    })
  }

  if (badges.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
            badge.className
          )}
        >
          <span>{badge.icon}</span>
          <span>{badge.label}</span>
        </span>
      ))}
    </div>
  )
}
