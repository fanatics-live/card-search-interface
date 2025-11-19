import { GradingService } from '@/types/algolia'

/**
 * Get display-friendly grade label
 */
export function formatGrade(grade: string | number | null | undefined): string {
  if (grade === null || grade === undefined) return 'Ungraded'
  return String(grade)
}

/**
 * Get grade color class based on service and grade
 */
export function getGradeColorClass(
  service: string | undefined,
  gradeValue: number | null | undefined
): string {
  if (!service || gradeValue === null || gradeValue === undefined) {
    return 'bg-gray-500 text-white'
  }

  const serviceName = service.toUpperCase()

  // PSA color coding
  if (serviceName === 'PSA') {
    if (gradeValue >= 10) return 'bg-grade-psa-10 text-white'
    if (gradeValue >= 9) return 'bg-grade-psa-9 text-white'
    if (gradeValue >= 8) return 'bg-grade-psa-8 text-white'
    return 'bg-gray-600 text-white'
  }

  // BGS color coding
  if (serviceName === 'BGS' || serviceName === 'BECKETT') {
    if (gradeValue >= 10) return 'bg-grade-bgs-10 text-yellow-400'
    if (gradeValue >= 9.5) return 'bg-grade-bgs-95 text-white'
    if (gradeValue >= 9) return 'bg-blue-600 text-white'
    return 'bg-gray-600 text-white'
  }

  // SGC color coding
  if (serviceName === 'SGC') {
    if (gradeValue >= 10) return 'bg-red-600 text-white'
    if (gradeValue >= 9) return 'bg-red-500 text-white'
    return 'bg-gray-600 text-white'
  }

  // CGC/CSG color coding
  if (serviceName === 'CGC' || serviceName === 'CSG') {
    if (gradeValue >= 10) return 'bg-purple-600 text-white'
    if (gradeValue >= 9) return 'bg-purple-500 text-white'
    return 'bg-gray-600 text-white'
  }

  // Default
  return 'bg-gray-600 text-white'
}

/**
 * Get grade label for display (e.g., "Gem Mint", "Mint")
 */
export function getGradeLabel(gradeValue: number | null | undefined): string {
  if (gradeValue === null || gradeValue === undefined) return 'Ungraded'

  if (gradeValue >= 10) return 'Gem Mint'
  if (gradeValue >= 9.5) return 'Gem Mint'
  if (gradeValue >= 9) return 'Mint'
  if (gradeValue >= 8.5) return 'Near Mint-Mint+'
  if (gradeValue >= 8) return 'Near Mint-Mint'
  if (gradeValue >= 7.5) return 'Near Mint+'
  if (gradeValue >= 7) return 'Near Mint'
  if (gradeValue >= 6) return 'Excellent-Mint'
  return 'Good-Excellent'
}

/**
 * Get grading service logo URL (placeholder for now)
 */
export function getGradingServiceLogo(service: string | undefined): string | null {
  if (!service) return null

  const logos: Record<string, string> = {
    PSA: '/logos/psa.svg',
    BGS: '/logos/bgs.svg',
    BECKETT: '/logos/beckett.svg',
    SGC: '/logos/sgc.svg',
    CGC: '/logos/cgc.svg',
    CSG: '/logos/csg.svg',
  }

  return logos[service.toUpperCase()] || null
}
