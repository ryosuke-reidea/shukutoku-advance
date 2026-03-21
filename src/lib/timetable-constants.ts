/**
 * 時間割グリッド共通定数
 * 複数ページで重複していた定義を一箇所に集約
 *
 * ⚠️ SHARED FILE: このファイルは shukutoku-advance と admin-shukutoku-advance で同期が必要です
 * 変更時はもう一方のプロジェクトにも反映してください
 */

// ============================================================
// 曜日
// ============================================================
export const WEEKDAYS = ['月', '火', '水', '木', '金'] as const
export const ALL_DAYS = ['月', '火', '水', '木', '金', '土'] as const

// ============================================================
// 時限定義（集団授業）
// ============================================================
export const WEEKDAY_PERIODS = [
  { label: '1限', time: '15:30〜16:50' },
  { label: '2限', time: '17:00〜18:20' },
  { label: '3限', time: '18:30〜19:50' },
] as const

export const SATURDAY_PERIODS = [
  { label: '1限', time: '13:10〜14:30' },
  { label: '2限', time: '14:40〜16:00' },
  { label: '3限', time: '16:10〜17:30' },
  { label: '4限', time: '17:40〜19:00' },
] as const

export const MAX_PERIODS = 4

// ============================================================
// 個別指導用の時限定義
// ============================================================
export const INDIVIDUAL_PERIODS_WEEKDAY = [
  { label: '1限', time: '15:30〜16:50' },
  { label: '2限', time: '17:00〜18:20' },
  { label: '3限', time: '18:30〜19:50' },
] as const

export const INDIVIDUAL_PERIODS_SATURDAY = [
  { label: '1限', time: '13:10〜14:30' },
  { label: '2限', time: '14:40〜16:00' },
  { label: '3限', time: '16:10〜17:30' },
  { label: '4限', time: '17:40〜19:00' },
] as const

// ============================================================
// カテゴリ色（集団授業のカテゴリ別）
// 明るく華やかなトーン。パッと目を引く鮮やかさ。
// ============================================================
export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string; headerBg: string; headerText: string }> = {
  general:        { bg: '#CDF0F4', border: '#1AABB8', text: '#0A7D88', gradient: 'linear-gradient(135deg, #1AABB8, #35CCD8)', headerBg: '#CDF0F4', headerText: '#0A7D88' },
  recommendation: { bg: '#FFECC8', border: '#E8A030', text: '#A87000', gradient: 'linear-gradient(135deg, #E8A030, #F5C050)', headerBg: '#FFECC8', headerText: '#A87000' },
  ryugata:        { bg: '#CCEED8', border: '#26B860', text: '#157840', gradient: 'linear-gradient(135deg, #26B860, #4CD890)', headerBg: '#CCEED8', headerText: '#157840' },
  junior:         { bg: '#D4E6FC', border: '#3C82D8', text: '#1852AC', gradient: 'linear-gradient(135deg, #3C82D8, #68A8F8)', headerBg: '#D4E6FC', headerText: '#1852AC' },
}

export const INDIVIDUAL_COLOR = {
  bg: '#E6D8FC',
  border: '#8C5CC8',
  text: '#5E3498',
  gradient: 'linear-gradient(135deg, #8C5CC8, #B088E8)',
  headerBg: '#E6D8FC',
  headerText: '#5E3498',
}

export const CATEGORY_LABELS: Record<string, string> = {
  general: '一般',
  recommendation: '推薦',
  ryugata: '留型',
  junior: '中学',
}
