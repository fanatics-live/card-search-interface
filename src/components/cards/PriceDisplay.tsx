import { formatPrice, getPriceDifferencePercentage } from '@/lib/formatters/priceFormatter'
import { cn } from '@/lib/utils/cn'

interface PriceDisplayProps {
  currentPrice: number
  marketValue?: number
  className?: string
  showComparison?: boolean
}

export function PriceDisplay({
  currentPrice,
  marketValue,
  className,
  showComparison = true,
}: PriceDisplayProps) {
  const hasMarketValue = marketValue && marketValue > 0
  const priceDiff = hasMarketValue ? getPriceDifferencePercentage(currentPrice, marketValue!) : 0
  const isGreatDeal = priceDiff <= -10

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-gray-900">
          {formatPrice(currentPrice)}
        </span>
      </div>

      {showComparison && hasMarketValue && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">
            Market: {formatPrice(marketValue!)}
          </span>
          {priceDiff !== 0 && (
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                isGreatDeal
                  ? 'bg-value-great-price/10 text-value-great-price'
                  : priceDiff < 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}
            >
              {priceDiff > 0 ? '+' : ''}{priceDiff}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
