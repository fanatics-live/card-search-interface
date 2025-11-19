/**
 * Format price in cents to dollar string
 */
export function formatPrice(priceInDollars: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInDollars)
}

/**
 * Format price range
 */
export function formatPriceRange(min: number, max: number): string {
  if (min === 0 && max === Infinity) return 'Any price'
  if (min === 0) return `Under ${formatPrice(max)}`
  if (max === Infinity) return `${formatPrice(min)}+`
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

/**
 * Get price difference percentage
 */
export function getPriceDifferencePercentage(currentPrice: number, marketValue: number): number {
  if (!marketValue || marketValue === 0) return 0
  return Math.round(((currentPrice - marketValue) / marketValue) * 100)
}

/**
 * Check if price is a great deal
 */
export function isGreatPrice(currentPrice: number, marketValue: number): boolean {
  const diff = getPriceDifferencePercentage(currentPrice, marketValue)
  return diff <= -10 // 10% or more below market
}
