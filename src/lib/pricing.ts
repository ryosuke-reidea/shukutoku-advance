/**
 * 料金計算ユーティリティ
 *
 * DB (tuition_info テーブル) から料金設定を取得して計算。
 * DB が読めない場合はフォールバック定数を使用。
 */

import type { TuitionInfo } from '@/lib/types/database'

// ============================================================
// PricingConfig 型
// ============================================================
export interface PricingConfig {
  groupPricePerCourse: number
  flatRateThresholds: Record<string, { minCourses: number; flatRate: number }>
  individualPrices: Record<string, number>
}

// ============================================================
// フォールバック定数（DBが読めないときのデフォルト）
// ============================================================
const FALLBACK_CONFIG: PricingConfig = {
  groupPricePerCourse: 11_000,
  flatRateThresholds: {
    '高3': { minCourses: 6, flatRate: 55_000 },
    '高2': { minCourses: 5, flatRate: 44_000 },
    '高1': { minCourses: 3, flatRate: 27_500 },
  },
  individualPrices: {
    individual_1on1: 24_000,
    individual_1on2: 19_000,
    individual_1on3: 15_000,
  },
}

// ============================================================
// 後方互換用エクスポート（既存の呼び出し元が壊れないように）
// ============================================================
export const GROUP_PRICE_PER_COURSE = FALLBACK_CONFIG.groupPricePerCourse
export const FLAT_RATE_THRESHOLDS = FALLBACK_CONFIG.flatRateThresholds
export const INDIVIDUAL_PRICES = FALLBACK_CONFIG.individualPrices

// ============================================================
// tuition_info 行を PricingConfig にパース（pure関数・クライアントからも使用可）
// ============================================================
export function parsePricingConfig(rows: TuitionInfo[]): PricingConfig {
  const config: PricingConfig = {
    groupPricePerCourse: FALLBACK_CONFIG.groupPricePerCourse,
    flatRateThresholds: {},
    individualPrices: {},
  }

  for (const row of rows) {
    switch (row.course_type) {
      case 'group_per_course':
        config.groupPricePerCourse = row.price
        break
      case 'flat_rate':
        if (row.min_courses) {
          config.flatRateThresholds[row.label] = {
            minCourses: row.min_courses,
            flatRate: row.price,
          }
        }
        break
      case 'individual_1on1':
      case 'individual_1on2':
      case 'individual_1on3':
        config.individualPrices[row.course_type] = row.price
        break
    }
  }

  // flat_rate が1件もなければフォールバック
  if (Object.keys(config.flatRateThresholds).length === 0) {
    config.flatRateThresholds = FALLBACK_CONFIG.flatRateThresholds
  }
  // individual が1件もなければフォールバック
  if (Object.keys(config.individualPrices).length === 0) {
    config.individualPrices = FALLBACK_CONFIG.individualPrices
  }

  return config
}

// ============================================================
// 計算関数（config はオプショナル → 未指定ならフォールバック使用）
// ============================================================

/**
 * 集団授業の合計料金を計算
 */
export function calculateGroupTotal(
  courseCount: number,
  grade: string | null,
  config: PricingConfig = FALLBACK_CONFIG,
): { total: number; isFlatRate: boolean; perCourse: number } {
  if (grade && config.flatRateThresholds[grade]) {
    const threshold = config.flatRateThresholds[grade]
    if (courseCount >= threshold.minCourses) {
      return {
        total: threshold.flatRate,
        isFlatRate: true,
        perCourse: Math.round(threshold.flatRate / courseCount),
      }
    }
  }

  const total = courseCount * config.groupPricePerCourse
  return {
    total,
    isFlatRate: false,
    perCourse: config.groupPricePerCourse,
  }
}

/**
 * 個別指導の1講座あたりの料金を取得
 */
export function getIndividualPrice(
  format: string,
  config: PricingConfig = FALLBACK_CONFIG,
): number {
  return config.individualPrices[format] ?? 0
}

/**
 * 個別指導の合計料金を計算
 */
export function calculateIndividualTotal(
  format: string,
  courseCount: number,
  config: PricingConfig = FALLBACK_CONFIG,
): number {
  return getIndividualPrice(format, config) * courseCount
}
