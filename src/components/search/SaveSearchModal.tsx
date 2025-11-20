import { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { saveSearch, isSearchSaved, updateDiscordWebhook, getSavedSearches } from '@/lib/search/savedSearches'
import type { SavedSearchFilters } from '@/lib/search/savedSearches'
import { cn } from '@/lib/utils/cn'

interface SaveSearchModalProps {
  isOpen: boolean
  onClose: () => void
  query: string
  filters?: SavedSearchFilters
  onSaved?: () => void
}

export function SaveSearchModal({
  isOpen,
  onClose,
  query,
  filters,
  onSaved,
}: SaveSearchModalProps) {
  const [includeFilters, setIncludeFilters] = useState(true)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [discordWebhook, setDiscordWebhook] = useState('')
  const [showDiscordInput, setShowDiscordInput] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // Check if already saved and load Discord webhook if exists
  useEffect(() => {
    if (isOpen) {
      const alreadySaved = isSearchSaved(query, includeFilters ? filters : undefined)
      if (alreadySaved) {
        const searches = getSavedSearches()
        const existing = searches.find(s =>
          s.query.toLowerCase() === query.toLowerCase() &&
          JSON.stringify(s.filters || {}) === JSON.stringify(includeFilters ? filters || {} : {})
        )
        if (existing?.discordWebhook) {
          setDiscordWebhook(existing.discordWebhook)
          setShowDiscordInput(true)
        }
      }
    }
  }, [isOpen, query, filters, includeFilters])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSave = () => {
    const filtersToSave = includeFilters ? filters : undefined
    console.log('Saving search:', query, 'with filters:', filtersToSave)
    setError('')

    try {
      // Check if already saved before attempting
      const alreadySaved = isSearchSaved(query, filtersToSave)
      console.log('Already saved?', alreadySaved)

      const savedSearch = saveSearch(query, filtersToSave, enableNotifications)
      console.log('Search saved successfully:', savedSearch)

      // Save Discord webhook if provided
      if (discordWebhook.trim()) {
        // Basic validation
        if (!discordWebhook.includes('discord.com/api/webhooks/')) {
          setError('Invalid Discord webhook URL')
          return
        }
        updateDiscordWebhook(savedSearch.id, discordWebhook.trim())
      }

      onSaved?.()
      onClose()

      // Reset state
      setIncludeFilters(true)
      setEnableNotifications(true)
      setDiscordWebhook('')
      setShowDiscordInput(false)
    } catch (err) {
      console.error('Error saving search:', err)
      setError(err instanceof Error ? err.message : 'Failed to save search')
    }
  }

  const hasFilters = filters && (
    (filters.smartPills && filters.smartPills.length > 0) ||
    (filters.sidebarFilters && (
      (filters.sidebarFilters.status && filters.sidebarFilters.status.length > 0) ||
      (filters.sidebarFilters.marketplace && filters.sidebarFilters.marketplace.length > 0) ||
      (filters.sidebarFilters.gradingService && filters.sidebarFilters.gradingService.length > 0)
    ))
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Save Search</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Query Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
              {query}
            </div>
          </div>

          {/* Include Filters Option */}
          {hasFilters && (
            <div className="flex items-start">
              <input
                type="checkbox"
                id="include-filters"
                checked={includeFilters}
                onChange={(e) => setIncludeFilters(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="include-filters" className="ml-3 text-sm">
                <span className="font-medium text-gray-900">Include current filters</span>
                <p className="text-gray-500 mt-1">
                  Save active smart pills and sidebar filters with this search
                </p>
              </label>
            </div>
          )}

          {/* Enable Notifications */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="enable-notifications"
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enable-notifications" className="ml-3 text-sm">
              <span className="font-medium text-gray-900">Notify me of new listings</span>
              <p className="text-gray-500 mt-1">
                Show a badge when new items match this search
              </p>
            </label>
          </div>

          {/* Discord Integration */}
          <div className="border-t border-gray-200 pt-4">
            {!showDiscordInput ? (
              <button
                onClick={() => setShowDiscordInput(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Discord Notifications (Optional)
              </button>
            ) : (
              <div className="space-y-2">
                <label htmlFor="discord-webhook" className="block text-sm font-medium text-gray-700">
                  Discord Webhook URL
                </label>
                <input
                  type="url"
                  id="discord-webhook"
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Get notified in Discord when new items appear.{' '}
                  <a
                    href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Learn how to create a webhook
                  </a>
                </p>
                <button
                  onClick={() => {
                    setShowDiscordInput(false)
                    setDiscordWebhook('')
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Remove Discord integration
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
              'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            {isSearchSaved(query, includeFilters ? filters : undefined)
              ? 'Update Search'
              : 'Save Search'}
          </button>
        </div>
      </div>
    </div>
  )
}
