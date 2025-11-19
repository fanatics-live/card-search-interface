import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { SmartPill as SmartPillType } from '@/types/smartPills'

interface SmartPillProps {
  pill: SmartPillType
  onClick: (pill: SmartPillType) => void
  index?: number
}

const COLOR_CLASSES = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 active:bg-blue-300',
  green: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 active:bg-green-300',
  purple:
    'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 active:bg-purple-300',
  amber: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 active:bg-amber-300',
  red: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 active:bg-red-300',
  gray: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 active:bg-gray-300',
}

const ACTIVE_COLOR_CLASSES = {
  blue: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-md ring-2 ring-blue-300',
  green: 'bg-green-600 text-white border-green-700 hover:bg-green-700 shadow-md ring-2 ring-green-300',
  purple: 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700 shadow-md ring-2 ring-purple-300',
  amber: 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700 shadow-md ring-2 ring-amber-300',
  red: 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-md ring-2 ring-red-300',
  gray: 'bg-gray-600 text-white border-gray-700 hover:bg-gray-700 shadow-md ring-2 ring-gray-300',
}

export function SmartPill({ pill, onClick, index = 0 }: SmartPillProps) {
  const colorClass = pill.isActive
    ? ACTIVE_COLOR_CLASSES[pill.color || 'blue']
    : COLOR_CLASSES[pill.color || 'blue']

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={() => onClick(pill)}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
        'cursor-pointer select-none',
        colorClass
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Checkmark for active pills */}
      {pill.isActive && <span className="text-base leading-none">✓</span>}

      {/* Icon */}
      {pill.icon && <span className="text-base leading-none">{pill.icon}</span>}

      {/* Label */}
      <span>{pill.label}</span>

      {/* Count Badge */}
      {pill.count !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
            pill.isActive
              ? 'bg-white/20 text-white'
              : 'bg-white/60 text-gray-700'
          )}
        >
          {pill.count.toLocaleString()}
        </span>
      )}
    </motion.button>
  )
}
