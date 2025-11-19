import { formatGrade, getGradeColorClass, getGradeLabel } from '@/lib/formatters/gradeFormatter'
import { cn } from '@/lib/utils/cn'

interface GradeBadgeProps {
  service?: string
  grade?: string | number | null
  gradeValue?: number | null
  className?: string
  showLabel?: boolean
}

export function GradeBadge({
  service,
  grade,
  gradeValue,
  className,
  showLabel = false,
}: GradeBadgeProps) {
  if (!service || (grade === null && gradeValue === null)) {
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-500 text-white', className)}>
        RAW
      </span>
    )
  }

  const displayGrade = formatGrade(grade)
  const colorClass = getGradeColorClass(service, gradeValue)
  const gradeDescriptor = showLabel ? getGradeLabel(gradeValue) : null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase',
          colorClass
        )}
      >
        {service} {displayGrade}
      </span>
      {gradeDescriptor && (
        <span className="text-xs text-gray-600">{gradeDescriptor}</span>
      )}
    </div>
  )
}
