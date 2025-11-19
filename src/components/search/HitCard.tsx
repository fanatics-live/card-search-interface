import { motion } from 'framer-motion'
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { AlgoliaCardHit } from '@/types/algolia'
import { CardImage } from '@/components/cards/CardImage'
import { GradeBadge } from '@/components/cards/GradeBadge'
import { PriceDisplay } from '@/components/cards/PriceDisplay'
import { ValueBadges } from '@/components/cards/ValueBadges'
import { cn } from '@/lib/utils/cn'

interface HitCardProps {
  hit: AlgoliaCardHit
  index?: number
}

export function HitCard({ hit, index = 0 }: HitCardProps) {
  // Extract image URL from nested structure - prefer primary/large, fallback to primary/medium
  const imageUrl = hit.images?.primary?.large || hit.images?.primary?.medium || hit.images?.secondary?.large || hit.images?.secondary?.medium
  const hasMetadata = hit.favoriteCount || hit.offerCount
  // First 8 cards (2 rows on desktop) load eagerly for instant feel
  const isPriority = index < 8

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden card-hover cursor-pointer h-full flex flex-col">
        {/* Card Image with Badges */}
        <div className="relative">
          <CardImage
            src={imageUrl}
            alt={hit.title}
            className="group-hover:scale-105 transition-transform duration-300"
            priority={isPriority}
          />

          {/* Marketplace Badge - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {hit.marketplace === 'WEEKLY' ? (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
                AUCTION
              </span>
            ) : hit.marketplace === 'PREMIER' ? (
              <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded">
                PREMIER
              </span>
            ) : (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                BUY NOW
              </span>
            )}
          </div>

          {/* Lot Number - Bottom Left */}
          {hit.listingId && (
            <div className="absolute bottom-2 left-2">
              <span className="px-2 py-1 bg-black/70 text-white text-xs font-mono rounded backdrop-blur-sm">
                Lot #{hit.listingId}
              </span>
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="p-4 flex-1 flex flex-col space-y-3">
          {/* Grade Badge */}
          <GradeBadge
            service={hit.gradingService}
            grade={hit.grade}
            gradeValue={hit.gradeValue}
          />

          {/* Title and Subtitle */}
          <div className="flex-1">
            <h3
              className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight"
              dangerouslySetInnerHTML={{
                __html: hit._highlightResult?.title?.value || hit.title,
              }}
            />
            {hit.subtitle && (
              <p
                className="text-xs text-gray-600 mt-1 line-clamp-1"
                dangerouslySetInnerHTML={{
                  __html: hit._highlightResult?.subtitle?.value || hit.subtitle,
                }}
              />
            )}
          </div>

          {/* Value Badges */}
          <ValueBadges
            greatPrice={hit.greatPrice}
            fanaticsAuthentic={hit.fanaticsAuthentic}
            hasOffers={hit.hasOffers}
          />

          {/* Price */}
          <PriceDisplay
            currentPrice={hit.currentPrice}
            marketValue={hit.value}
            showComparison={true}
          />

          {/* Metadata Footer */}
          {hasMetadata && (
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
              {hit.favoriteCount !== undefined && hit.favoriteCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <HeartIcon className="w-4 h-4" />
                  <span>{hit.favoriteCount}</span>
                </div>
              )}
              {hit.offerCount !== undefined && hit.offerCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>{hit.offerCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Cert Number */}
          {hit.certNumber && (
            <div className="text-xs text-gray-500 font-mono">
              Cert: {hit.certNumber}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
