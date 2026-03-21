/**
 * 個別指導・申込関連の共通ヘルパー
 * ⚠️ SHARED FILE: このファイルは shukutoku-advance と admin-shukutoku-advance で同期が必要です
 * 変更時は両方のプロジェクトに反映してください
 */
import type { EnrollmentStatus } from '@/lib/types/database'

// ============================================================
// 個別指導のnotesパース
// ============================================================
export interface IndividualNotes {
  type: 'individual'
  day?: string
  period?: string
  subject?: string
  subjects?: string[]
  courseCount?: number
  format?: string
  slots?: { day: string; period: string }[]
  friendNames?: string[]
  continuation?: string
  term_id?: string
}

export function parseIndividualNotes(notes: string | null): IndividualNotes | null {
  if (!notes) return null
  try {
    const parsed = JSON.parse(notes)
    if (parsed.type === 'individual') return parsed
    return null
  } catch {
    return null
  }
}

/**
 * 個別指導の教科表示（重複科目はカウント: "英語×2・数学"）
 */
export function getIndividualSubjectDisplay(notes: { subject?: string; subjects?: string[] } | null): string {
  if (!notes) return ''
  if (notes.subjects && notes.subjects.length > 0) {
    const counts: Record<string, number> = {}
    notes.subjects.forEach((s) => { counts[s] = (counts[s] || 0) + 1 })
    return Object.entries(counts).map(([s, c]) => c > 1 ? `${s}×${c}` : s).join('・')
  }
  if (notes.subject) return notes.subject
  return ''
}

// ============================================================
// 個別指導フォーマットラベル
// ============================================================
export const INDIVIDUAL_FORMAT_LABELS: Record<string, string> = {
  individual_1on1: '1対1',
  individual_1on2: '1対2',
  individual_1on3: '1対3',
}

// ============================================================
// Enrollmentステータスバッジ
// ============================================================
export const ENROLLMENT_STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
  completed: 'outline',
}

export function getEnrollmentBadgeVariant(status: EnrollmentStatus) {
  return ENROLLMENT_STATUS_COLORS[status] ?? ('secondary' as const)
}

// ============================================================
// 通貨フォーマット
// ============================================================
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

// ============================================================
// 時限パース
// ============================================================
export function parsePeriodNumber(periodStr: string): number {
  const match = periodStr.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}
