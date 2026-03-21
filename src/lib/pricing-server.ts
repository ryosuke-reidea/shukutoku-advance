/**
 * サーバーサイド専用: DBから料金設定を取得
 * クライアントコンポーネントからはインポートしないこと
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { parsePricingConfig } from '@/lib/pricing'
import type { PricingConfig } from '@/lib/pricing'
import type { TuitionInfo } from '@/lib/types/database'

// フォールバック定数
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

export async function fetchPricingConfig(): Promise<PricingConfig> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('tuition_info')
      .select('*')
      .order('display_order')

    if (error || !data || data.length === 0) {
      console.warn('Failed to fetch tuition_info, using fallback pricing')
      return FALLBACK_CONFIG
    }

    return parsePricingConfig(data as TuitionInfo[])
  } catch {
    return FALLBACK_CONFIG
  }
}
