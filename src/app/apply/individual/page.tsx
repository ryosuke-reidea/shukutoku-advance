'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Check, ArrowRight, ArrowLeft, Clock, BookOpen, Users, CreditCard, ClipboardCheck, CheckCircle2, Home, User, Loader2, AlertCircle, X, Plus, Minus, RefreshCw, Info, CalendarDays,
} from 'lucide-react'
import { SUBJECTS, PAYMENT_METHODS, COURSE_TYPES } from '@/lib/constants'
import type { PaymentMethod, Course } from '@/lib/types/database'
import { calculateIndividualTotal, calculateGroupTotal, getIndividualPrice, parsePricingConfig, INDIVIDUAL_PRICES, GROUP_PRICE_PER_COURSE } from '@/lib/pricing'
import type { PricingConfig } from '@/lib/pricing'
import type { TuitionInfo } from '@/lib/types/database'
import {
  ALL_DAYS,
  INDIVIDUAL_PERIODS_WEEKDAY,
  INDIVIDUAL_PERIODS_SATURDAY,
} from '@/lib/timetable-constants'
import { formatTime } from '@/lib/utils'

const DEFAULT_FORMAT_OPTIONS = [
  { value: 'individual_1on1', label: '1対1', description: '講師1名に対して生徒1名', price: INDIVIDUAL_PRICES.individual_1on1 },
  { value: 'individual_1on2', label: '1対2', description: '講師1名に対して生徒2名（友人と一緒に受講）', price: INDIVIDUAL_PRICES.individual_1on2 },
  { value: 'individual_1on3', label: '1対3', description: '講師1名に対して生徒3名（友人と一緒に受講）', price: INDIVIDUAL_PRICES.individual_1on3 },
]

// ステップ定義用の型
interface StepDef {
  id: string
  label: string
  icon: typeof Clock
}

interface SlotSelection {
  day: string
  period: string
}

interface ExistingIndividualEnrollment {
  id: string
  day: string
  period: string
  format: string
  subjects: string[]
  courseCount: number
  paymentAmount: number
  status: string
}

interface ExistingGroupEnrollment {
  id: string
  courseId: string
  courseName: string
  subject: string
  targetGrade: string | null
  paymentAmount: number
  status: string
}

function getPeriodsForDay(day: string) {
  return day === '土' ? INDIVIDUAL_PERIODS_SATURDAY : INDIVIDUAL_PERIODS_WEEKDAY
}

function getPeriodTime(day: string, period: string): string {
  const periods = getPeriodsForDay(day)
  const p = periods.find((p) => p.label === period)
  return p?.time ?? ''
}

function slotKey(slot: SlotSelection): string {
  return `${slot.day}-${slot.period}`
}

export default function IndividualApplyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <IndividualApplyContent />
    </Suspense>
  )
}

function IndividualApplyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // ============================================================
  // 集団授業パラメータ
  // ============================================================
  const coursesParam = searchParams.get('courses') ?? ''
  const groupCourseIds = useMemo(() => coursesParam.split(',').filter(Boolean), [coursesParam])
  const hasGroupCourses = groupCourseIds.length > 0

  // 集団授業のコース情報
  const [groupCourses, setGroupCourses] = useState<Course[]>([])
  const [groupCoursesLoading, setGroupCoursesLoading] = useState(hasGroupCourses)

  // ============================================================
  // 個別指導パラメータ
  // ============================================================
  const slotsParam = searchParams.get('slots') ?? ''
  const initialSlots = useMemo(() => {
    if (!slotsParam) return []
    return slotsParam.split(',').map((s) => {
      const [day, period] = s.split('-')
      return { day, period }
    }).filter((s) => s.day && s.period)
  }, [slotsParam])
  const hasIndividualSlots = initialSlots.length > 0

  // ============================================================
  // 料金設定
  // ============================================================
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)

  // DB料金をフェッチ + 集団コース情報を取得
  useEffect(() => {
    const fetchData = async () => {
      const { data: tuitionData } = await supabase.from('tuition_info').select('*').order('display_order')
      if (tuitionData) {
        setPricingConfig(parsePricingConfig(tuitionData as TuitionInfo[]))
      }

      if (hasGroupCourses) {
        const { data: coursesData } = await supabase.from('courses').select('*').in('id', groupCourseIds)
        if (coursesData) {
          setGroupCourses(coursesData)
        }
        setGroupCoursesLoading(false)
      }
    }
    fetchData()
  }, [])

  // ============================================================
  // ステップの動的定義
  // ============================================================
  const steps: StepDef[] = useMemo(() => {
    const s: StepDef[] = []
    if (hasIndividualSlots) {
      s.push({ id: 'slots', label: '時間帯', icon: Clock })
      s.push({ id: 'subjects', label: '教科', icon: BookOpen })
      s.push({ id: 'format', label: '形態', icon: Users })
    }
    s.push({ id: 'payment', label: '支払い', icon: CreditCard })
    s.push({ id: 'confirm', label: '確認', icon: ClipboardCheck })
    s.push({ id: 'complete', label: '完了', icon: CheckCircle2 })
    return s
  }, [hasIndividualSlots])

  // Step state
  const [stepIndex, setStepIndex] = useState(0)
  const currentStepId = steps[stepIndex]?.id ?? 'payment'

  // ============================================================
  // Individual step states
  // ============================================================
  // Step: 時間帯（複数選択）
  const [selectedSlots, setSelectedSlots] = useState<SlotSelection[]>(initialSlots)

  // Step: 講座数＋教科
  const [courseCount, setCourseCount] = useState<number>(1)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  // Step: 形態
  const [selectedFormat, setSelectedFormat] = useState<string>('individual_1on1')
  const [friendName1, setFriendName1] = useState('')
  const [friendName2, setFriendName2] = useState('')

  // ============================================================
  // Shared step states
  // ============================================================
  // Step: 支払い
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [continuation, setContinuation] = useState<'continuation' | 'new'>('new')

  // Step: 確認・送信
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(false)

  // 既存申込の検出
  const [existingIndividual, setExistingIndividual] = useState<ExistingIndividualEnrollment[]>([])
  const [existingGroup, setExistingGroup] = useState<ExistingGroupEnrollment[]>([])
  const [enrollMode, setEnrollMode] = useState<'replace' | 'add' | null>(null)
  const [checkingExisting, setCheckingExisting] = useState(false)

  // URLパラメータからスロット情報を復元（初期値以外のrestore用）
  useEffect(() => {
    if (initialSlots.length > 0 && selectedSlots.length === 0) {
      setSelectedSlots(initialSlots)
    }
  }, [initialSlots])

  // Auth check when entering confirm step
  useEffect(() => {
    if (currentStepId === 'confirm') {
      setAuthChecking(true)
      setCheckingExisting(true)
      const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          sessionStorage.setItem('unified_apply_state', JSON.stringify({
            selectedSlots, courseCount, selectedSubjects, selectedFormat,
            friendName1, friendName2, paymentMethod, continuation,
            groupCourseIds: hasGroupCourses ? groupCourseIds : [],
          }))
          // ログイン後にリダイレクトするURLに元のパラメータも含める
          const restoreParams = new URLSearchParams()
          restoreParams.set('restore', 'true')
          if (hasGroupCourses) restoreParams.set('courses', groupCourseIds.join(','))
          if (selectedSlots.length > 0) restoreParams.set('slots', selectedSlots.map(s => `${s.day}-${s.period}`).join(','))
          const redirectUrl = `/apply/individual?${restoreParams.toString()}`
          router.push(`/auth/student-login?next=${encodeURIComponent(redirectUrl)}`)
          return
        }
        setUserEmail(user.email ?? '')
        setUserName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '')
        setAuthChecking(false)

        // 既存申込チェック
        try {
          const res = await fetch('/api/enrollments/check')
          if (res.ok) {
            const checkData = await res.json()
            const hasExistingIndividual = hasIndividualSlots && checkData.individual && checkData.individual.length > 0
            const hasExistingGroup = hasGroupCourses && checkData.group && checkData.group.length > 0

            if (hasExistingIndividual) setExistingIndividual(checkData.individual)
            if (hasExistingGroup) setExistingGroup(checkData.group)

            if (!hasExistingIndividual && !hasExistingGroup) {
              setEnrollMode('add')
            }
          } else {
            setEnrollMode('add')
          }
        } catch {
          setEnrollMode('add')
        }
        setCheckingExisting(false)
      }
      checkAuth()
    }
  }, [currentStepId])

  // Restore state after login redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('restore') === 'true') {
      const saved = sessionStorage.getItem('unified_apply_state')
      if (saved) {
        try {
          const state = JSON.parse(saved)
          setSelectedSlots(state.selectedSlots || [])
          setCourseCount(state.courseCount || 1)
          setSelectedSubjects(state.selectedSubjects || [])
          setSelectedFormat(state.selectedFormat || 'individual_1on1')
          setFriendName1(state.friendName1 || '')
          setFriendName2(state.friendName2 || '')
          setPaymentMethod(state.paymentMethod || 'bank_transfer')
          setContinuation(state.continuation || 'new')
          // Restore to confirm step
          const confirmIdx = steps.findIndex((s) => s.id === 'confirm')
          if (confirmIdx >= 0) setStepIndex(confirmIdx)
          sessionStorage.removeItem('unified_apply_state')

          // Restore group courses if needed
          if (state.groupCourseIds && state.groupCourseIds.length > 0) {
            const fetchGroupCourses = async () => {
              const { data } = await supabase.from('courses').select('*').in('id', state.groupCourseIds)
              if (data) setGroupCourses(data)
              setGroupCoursesLoading(false)
            }
            fetchGroupCourses()
          }
        } catch { /* ignore */ }
      }
    }
  }, [])

  // ============================================================
  // 個別指導関連ヘルパー
  // ============================================================
  const toggleSlot = (day: string, period: string) => {
    setSelectedSlots((prev) => {
      const key = slotKey({ day, period })
      const exists = prev.some((s) => slotKey(s) === key)
      if (exists) {
        return prev.filter((s) => slotKey(s) !== key)
      } else {
        return [...prev, { day, period }]
      }
    })
  }

  const removeSlot = (slot: SlotSelection) => {
    setSelectedSlots((prev) => prev.filter((s) => slotKey(s) !== slotKey(slot)))
  }

  const isSlotSelected = (day: string, period: string): boolean => {
    return selectedSlots.some((s) => s.day === day && s.period === period)
  }

  // 教科の数量を増減
  const getSubjectCount = (subject: string): number => {
    return selectedSubjects.filter((s) => s === subject).length
  }

  const addSubject = (subject: string) => {
    if (selectedSubjects.length < courseCount) {
      setSelectedSubjects((prev) => [...prev, subject])
    }
  }

  const removeSubject = (subject: string) => {
    setSelectedSubjects((prev) => {
      const idx = prev.lastIndexOf(subject)
      if (idx === -1) return prev
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })
  }

  // 講座数が変更されたとき、選択済み教科を調整
  useEffect(() => {
    if (selectedSubjects.length > courseCount) {
      setSelectedSubjects((prev) => prev.slice(0, courseCount))
    }
  }, [courseCount])

  // ============================================================
  // ナビゲーション
  // ============================================================
  const canProceed = () => {
    switch (currentStepId) {
      case 'slots': return selectedSlots.length > 0
      case 'subjects': return courseCount >= 1 && courseCount <= 5 && selectedSubjects.length === courseCount
      case 'format':
        if (selectedFormat === 'individual_1on2') return friendName1.trim() !== ''
        if (selectedFormat === 'individual_1on3') return friendName1.trim() !== '' && friendName2.trim() !== ''
        return true
      case 'payment': return true
      default: return true
    }
  }

  const handleNext = () => {
    if (stepIndex < steps.length - 1 && canProceed()) setStepIndex(stepIndex + 1)
  }

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  // ============================================================
  // 料金計算
  // ============================================================
  // DB料金に基づくFORMAT_OPTIONS
  const FORMAT_OPTIONS = DEFAULT_FORMAT_OPTIONS.map((opt) => ({
    ...opt,
    price: pricingConfig?.individualPrices[opt.value] ?? opt.price,
  }))

  // 個別指導料金
  const individualTotalPrice = hasIndividualSlots
    ? calculateIndividualTotal(selectedFormat, courseCount, pricingConfig ?? undefined)
    : 0
  const individualUnitPrice = hasIndividualSlots
    ? getIndividualPrice(selectedFormat, pricingConfig ?? undefined)
    : 0

  // 集団授業料金
  const groupPricing = useMemo(() => {
    if (!hasGroupCourses || groupCourses.length === 0) {
      return { total: 0, isFlatRate: false, perCourse: pricingConfig?.groupPricePerCourse ?? GROUP_PRICE_PER_COURSE }
    }
    const grade = groupCourses[0]?.target_grade ?? null
    return calculateGroupTotal(groupCourses.length, grade, pricingConfig ?? undefined)
  }, [groupCourses, pricingConfig, hasGroupCourses])

  // 合計料金
  const grandTotal = individualTotalPrice + groupPricing.total

  // ============================================================
  // 送信
  // ============================================================
  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const mode = enrollMode ?? 'add'
      const promises: Promise<Response>[] = []

      // 集団授業の申し込み
      if (hasGroupCourses && groupCourseIds.length > 0) {
        promises.push(fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseIds: groupCourseIds,
            paymentMethod,
            mode,
          }),
        }))
      }

      // 個別指導の申し込み
      if (hasIndividualSlots && selectedSlots.length > 0) {
        promises.push(fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'individual',
            slots: selectedSlots,
            subjects: selectedSubjects,
            courseCount,
            format: selectedFormat,
            friendNames: [friendName1, friendName2].filter(Boolean),
            paymentMethod,
            continuation,
            mode,
          }),
        }))
      }

      const results = await Promise.all(promises)
      const errors: string[] = []

      for (const response of results) {
        if (!response.ok) {
          const result = await response.json()
          errors.push(result.error || '申し込みに失敗しました。')
        }
      }

      if (errors.length > 0) {
        setError(errors.join('\n'))
        setSubmitting(false)
        return
      }

      // 完了ステップへ
      const completeIdx = steps.findIndex((s) => s.id === 'complete')
      if (completeIdx >= 0) setStepIndex(completeIdx)
    } catch {
      setError('ネットワークエラーが発生しました。')
      setSubmitting(false)
    }
  }

  // ============================================================
  // 表示用ヘルパー
  // ============================================================
  const sortedSlots = [...selectedSlots].sort((a, b) => {
    const dayOrder = (ALL_DAYS as readonly string[]).indexOf(a.day) - (ALL_DAYS as readonly string[]).indexOf(b.day)
    if (dayOrder !== 0) return dayOrder
    return a.period.localeCompare(b.period)
  })

  const formatLabel = FORMAT_OPTIONS.find((f) => f.value === selectedFormat)?.label ?? ''

  const maxPeriods = Math.max(INDIVIDUAL_PERIODS_WEEKDAY.length, INDIVIDUAL_PERIODS_SATURDAY.length)

  const subjectSummary = (() => {
    const counts: Record<string, number> = {}
    selectedSubjects.forEach((s) => { counts[s] = (counts[s] || 0) + 1 })
    return Object.entries(counts).map(([s, c]) => c > 1 ? `${s}×${c}` : s).join('・')
  })()

  const hasExistingEnrollments = existingIndividual.length > 0 || existingGroup.length > 0

  // ページタイトル
  const pageTitle = hasGroupCourses && hasIndividualSlots
    ? '集団授業・個別指導 まとめて申し込み'
    : hasGroupCourses
      ? '集団授業 申し込み'
      : '個別指導 申し込み'

  // ============================================================
  // ローディング中
  // ============================================================
  if (groupCoursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ステッパー */}
      <div className="border-b bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 -mt-6 sm:-mt-8 mb-2">
        <nav aria-label="申し込み手順">
          <ol className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((stepDef, index) => {
              const isCompleted = index < stepIndex
              const isCurrent = index === stepIndex
              const Icon = stepDef.icon
              return (
                <li key={stepDef.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      'flex size-7 sm:size-9 items-center justify-center rounded-full border-2 transition-colors',
                      isCompleted && 'border-[#1b99a4] bg-[#1b99a4] text-white',
                      isCurrent && 'border-[#1b99a4] bg-white text-[#1b99a4]',
                      !isCompleted && !isCurrent && 'border-slate-300 bg-white text-slate-400'
                    )}>
                      {isCompleted ? <Check className="size-3 sm:size-4" /> : <Icon className="size-3 sm:size-4" />}
                    </div>
                    <span className={cn(
                      'text-[9px] sm:text-xs font-medium whitespace-nowrap',
                      isCurrent ? 'text-[#1b99a4]' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    )}>
                      {stepDef.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'mx-0.5 sm:mx-2 mt-[-1rem] h-0.5 flex-1',
                      index < stepIndex ? 'bg-[#1b99a4]' : 'bg-slate-200'
                    )} />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      {/* ===== 申し込み種別サマリー ===== */}
      {currentStepId !== 'complete' && (
        <div className="flex items-center gap-2 flex-wrap">
          {hasGroupCourses && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #21B8C5, #42D8E8)' }}>
              <CalendarDays className="size-3" />
              集団授業 {groupCourseIds.length}講座
            </div>
          )}
          {hasIndividualSlots && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8C5CC8, #B088E8)' }}>
              <Users className="size-3" />
              個別指導 {selectedSlots.length}コマ
            </div>
          )}
        </div>
      )}

      {/* ===== Step: 時間帯選択 ===== */}
      {currentStepId === 'slots' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">受講可能な時間帯を全て選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              受講可能な曜日・時限を<span className="font-bold text-[#1b99a4]">全てタップして選択</span>してください。
            </p>
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <strong>ポイント：</strong>受講できる時間帯は全て選択してください。選択肢が多いほど、スケジュール調整がしやすくなります。
            </div>
          </div>

          {/* 時間割グリッド */}
          <Card>
            <CardContent className="pt-6 px-2 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse timetable-sticky-col" style={{ minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th className="py-2 px-2 text-xs font-bold text-white text-center rounded-tl-lg" style={{ background: 'linear-gradient(135deg, #1b99a4, #21c5d3)', width: '80px' }}>
                        時限
                      </th>
                      {ALL_DAYS.map((day, i) => (
                        <th
                          key={day}
                          className={cn('py-2 px-2 text-xs font-bold text-white text-center', i === ALL_DAYS.length - 1 && 'rounded-tr-lg')}
                          style={{ background: day === '土' ? 'linear-gradient(135deg, #f6ad3c, #f9c76b)' : 'linear-gradient(135deg, #1b99a4, #21c5d3)' }}
                        >
                          {day}曜
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxPeriods }, (_, periodIdx) => {
                      const weekdayPeriod = INDIVIDUAL_PERIODS_WEEKDAY[periodIdx]
                      const saturdayPeriod = INDIVIDUAL_PERIODS_SATURDAY[periodIdx]
                      const label = weekdayPeriod?.label ?? saturdayPeriod?.label ?? `${periodIdx + 1}限`

                      return (
                        <tr key={periodIdx} className={periodIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-2 px-2 text-center border-r border-slate-100" style={{ backgroundColor: periodIdx % 2 === 0 ? '#e0f4f8' : '#d4e8ea' }}>
                            <div className="text-sm font-bold text-[#1b99a4]">{label}</div>
                            <div className="text-[9px] text-muted-foreground">
                              {weekdayPeriod?.time ?? saturdayPeriod?.time ?? ''}
                            </div>
                          </td>
                          {ALL_DAYS.map((day) => {
                            const periods = getPeriodsForDay(day)
                            const periodInfo = periods[periodIdx]
                            const isAvailable = !!periodInfo
                            const isSelected = isAvailable && isSlotSelected(day, periodInfo.label)

                            if (!isAvailable) {
                              return (
                                <td key={day} className="py-2 px-1 text-center border-r border-slate-100 last:border-r-0">
                                  <div className="flex items-center justify-center h-12">
                                    <div className="w-4 h-[2px] rounded-full bg-slate-200" />
                                  </div>
                                </td>
                              )
                            }

                            return (
                              <td key={day} className="py-2 px-1 text-center border-r border-slate-100 last:border-r-0">
                                <button
                                  onClick={() => toggleSlot(day, periodInfo.label)}
                                  className={cn(
                                    'w-full h-12 rounded-xl text-xs font-bold transition-all duration-200 border-2',
                                    isSelected
                                      ? 'border-[#1b99a4] bg-[#e0f4f8] text-[#1b99a4] shadow-md scale-[1.02]'
                                      : 'border-slate-200 bg-white text-slate-400 hover:border-[#1b99a4]/40 hover:bg-[#e0f4f8]/30'
                                  )}
                                >
                                  {isSelected ? (
                                    <Check className="size-5 mx-auto" />
                                  ) : (
                                    <span className="text-[10px]">{day === '土' ? saturdayPeriod?.time : weekdayPeriod?.time}</span>
                                  )}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 選択済みコマ一覧 */}
          {selectedSlots.length > 0 && (
            <Card className="border-[#1b99a4]/30 bg-[#e0f4f8]/20">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b99a4] text-white text-xs font-bold">
                    <Check className="size-3" />
                    {selectedSlots.length}コマ選択中
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortedSlots.map((slot) => (
                    <div
                      key={slotKey(slot)}
                      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-white border border-[#1b99a4]/30 text-sm"
                    >
                      <span className="font-bold text-[#1b99a4]">{slot.day}曜</span>
                      <span className="text-slate-600">{slot.period}</span>
                      <span className="text-[10px] text-muted-foreground">({getPeriodTime(slot.day, slot.period)})</span>
                      <button
                        onClick={() => removeSlot(slot)}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== Step: 講座数＋教科選択 ===== */}
      {currentStepId === 'subjects' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">講座数・教科を選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              講座数を選び、受講する教科を選択してください。<span className="font-bold text-[#1b99a4]">同じ教科を複数講座</span>選択することもできます。
            </p>
          </div>

          {/* 講座数 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">講座数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCourseCount(num)}
                    className={cn(
                      'py-4 rounded-xl text-center transition-all border-2',
                      courseCount === num
                        ? 'border-[#1b99a4] bg-[#e0f4f8] shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className={cn('text-2xl font-bold', courseCount === num ? 'text-[#1b99a4]' : 'text-slate-600')}>{num}</div>
                    <div className={cn('text-xs mt-0.5', courseCount === num ? 'text-[#1b99a4]' : 'text-muted-foreground')}>講座</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 教科選択 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                教科 <span className="text-sm font-normal text-muted-foreground">（{selectedSubjects.length}/{courseCount}講座分）</span>
              </CardTitle>
              <CardDescription>
                各教科の＋/−ボタンで数量を調整してください。同じ教科を複数選択できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {SUBJECTS.map((subject) => {
                  const count = getSubjectCount(subject)
                  const canAdd = selectedSubjects.length < courseCount
                  return (
                    <div
                      key={subject}
                      className={cn(
                        'flex items-center justify-between rounded-xl border-2 p-3 sm:p-4 transition-all',
                        count > 0 ? 'border-[#1b99a4] bg-[#e0f4f8]' : 'border-slate-200 bg-white'
                      )}
                    >
                      <span className={cn('text-base font-bold', count > 0 ? 'text-[#1b99a4]' : 'text-slate-600')}>{subject}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeSubject(subject)}
                          disabled={count === 0}
                          className={cn(
                            'size-8 rounded-full flex items-center justify-center transition-all',
                            count > 0
                              ? 'bg-white border border-[#1b99a4]/30 text-[#1b99a4] hover:bg-[#1b99a4] hover:text-white'
                              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          )}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className={cn('w-8 text-center text-lg font-bold', count > 0 ? 'text-[#1b99a4]' : 'text-slate-400')}>{count}</span>
                        <button
                          onClick={() => addSubject(subject)}
                          disabled={!canAdd}
                          className={cn(
                            'size-8 rounded-full flex items-center justify-center transition-all',
                            canAdd
                              ? 'bg-[#1b99a4] text-white hover:bg-[#158a94]'
                              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          )}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ステータスバー */}
          <div className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            selectedSubjects.length === courseCount
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}>
            {selectedSubjects.length === courseCount ? (
              <><Check className="size-4 inline mr-1" /><strong>{courseCount}講座</strong>：{subjectSummary}</>
            ) : (
              <>あと<strong>{courseCount - selectedSubjects.length}講座</strong>分の教科を選択してください。（{selectedSubjects.length}/{courseCount}）</>
            )}
          </div>
        </div>
      )}

      {/* ===== Step: 形態選択 ===== */}
      {currentStepId === 'format' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">受講形態を選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">1対1、1対2、1対3から選んでください。</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="space-y-3">
                {FORMAT_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer',
                      selectedFormat === opt.value ? 'border-[#1b99a4] bg-[#e0f4f8]' : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => setSelectedFormat(opt.value)}
                  >
                    <RadioGroupItem value={opt.value} id={`format-${opt.value}`} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`format-${opt.value}`} className="text-base font-bold cursor-pointer">{opt.label}</Label>
                        <span className="text-sm font-bold text-[#1b99a4]">{opt.price.toLocaleString()}円/講座/会期</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 友人名の入力 */}
          {(selectedFormat === 'individual_1on2' || selectedFormat === 'individual_1on3') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">一緒に受講する友人の氏名</CardTitle>
                <CardDescription>
                  {selectedFormat === 'individual_1on2'
                    ? '一緒に受講する友人1名の氏名を入力してください。'
                    : '一緒に受講する友人2名の氏名を入力してください。'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="friend1" className="text-sm font-medium">友人1</Label>
                  <Input id="friend1" value={friendName1} onChange={(e) => setFriendName1(e.target.value)} placeholder="氏名を入力" className="mt-1" />
                </div>
                {selectedFormat === 'individual_1on3' && (
                  <div>
                    <Label htmlFor="friend2" className="text-sm font-medium">友人2</Label>
                    <Input id="friend2" value={friendName2} onChange={(e) => setFriendName2(e.target.value)} placeholder="氏名を入力" className="mt-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== Step: 支払い方法 ===== */}
      {currentStepId === 'payment' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">支払い方法の選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">お支払い方法を選択してください。</p>
          </div>

          {/* 個別指導の場合：継続の有無 */}
          {hasIndividualSlots && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">継続の有無（個別指導）</CardTitle>
                <CardDescription>前会期からの継続受講かどうか選択してください。</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={continuation} onValueChange={(v) => setContinuation(v as 'continuation' | 'new')} className="space-y-3">
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer',
                      continuation === 'continuation' ? 'border-[#1b99a4] bg-[#e0f4f8]' : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => setContinuation('continuation')}
                  >
                    <RadioGroupItem value="continuation" id="continuation-yes" />
                    <Label htmlFor="continuation-yes" className="flex-1 cursor-pointer font-medium">継続受講（前の会期から引き続き受講）</Label>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer',
                      continuation === 'new' ? 'border-[#1b99a4] bg-[#e0f4f8]' : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => setContinuation('new')}
                  >
                    <RadioGroupItem value="new" id="continuation-no" />
                    <Label htmlFor="continuation-no" className="flex-1 cursor-pointer font-medium">新規受講（今回初めて／前の会期は未受講）</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">お支払い方法</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="space-y-3"
              >
                {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, string][]).map(([value, label]) => (
                  <div
                    key={value}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer',
                      paymentMethod === value ? 'border-[#1b99a4] bg-[#e0f4f8]' : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => setPaymentMethod(value)}
                  >
                    <RadioGroupItem value={value} id={`pay-${value}`} />
                    <Label htmlFor={`pay-${value}`} className="flex-1 cursor-pointer font-medium">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 料金プレビュー */}
          <Card className="border-[#1b99a4]/30 bg-[#e0f4f8]/20">
            <CardContent className="pt-4 pb-3 space-y-3">
              {hasGroupCourses && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">集団授業</p>
                    <p className="text-xs text-muted-foreground">{groupCourses.length}講座</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#1b99a4]">{groupPricing.total.toLocaleString()}円</p>
                    {groupPricing.isFlatRate && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 border border-green-200">会期定額制適用</span>
                    )}
                  </div>
                </div>
              )}
              {hasIndividualSlots && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">個別指導</p>
                    <p className="text-xs text-muted-foreground">{formatLabel} × {courseCount}講座</p>
                  </div>
                  <p className="text-base font-bold text-[#1b99a4]">{individualTotalPrice.toLocaleString()}円/会期</p>
                </div>
              )}
              {hasGroupCourses && hasIndividualSlots && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">合計</p>
                    <p className="text-lg font-bold text-[#1b99a4]">{grandTotal.toLocaleString()}円</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== Step: 確認 ===== */}
      {currentStepId === 'confirm' && (
        <div className="space-y-6">
          {(authChecking || checkingExisting) ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">お申し込み内容の確認</h1>
                <p className="mt-1 text-sm text-muted-foreground">内容をご確認のうえ、申し込みボタンを押してください。</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* 既存申込がある場合の選択UI */}
              {hasExistingEnrollments && enrollMode === null && (
                <Card className="border-amber-300 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                      <Info className="size-4" />
                      既存の申し込みがあります
                    </CardTitle>
                    <CardDescription className="text-amber-800">
                      現在の会期に既存の申し込みがあります。どのように処理しますか？
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {existingGroup.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-white p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-amber-900 mb-2">集団授業（{existingGroup.length}講座）：</p>
                        {existingGroup.map((e) => (
                          <div key={e.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{e.courseName}</span>
                            <span className="text-muted-foreground text-xs">{e.subject}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {existingIndividual.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-white p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-amber-900 mb-2">個別指導（{existingIndividual.length}件）：</p>
                        {existingIndividual.map((e) => (
                          <div key={e.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{e.day}曜 {e.period}</span>
                            <span className="text-muted-foreground text-xs">{e.subjects?.join('・') ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setEnrollMode('replace')}
                        className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-[#1b99a4] hover:bg-[#e0f4f8]/30"
                      >
                        <RefreshCw className="size-6 text-[#1b99a4]" />
                        <span className="font-bold text-slate-900">すべて置き換える</span>
                        <span className="text-xs text-muted-foreground text-center">
                          既存の申し込みをキャンセルし、<br />今回の内容のみにする
                        </span>
                      </button>
                      <button
                        onClick={() => setEnrollMode('add')}
                        className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-[#1b99a4] hover:bg-[#e0f4f8]/30"
                      >
                        <Plus className="size-6 text-[#1b99a4]" />
                        <span className="font-bold text-slate-900">追加する</span>
                        <span className="text-xs text-muted-foreground text-center">
                          既存の申し込みを残したまま、<br />新しい申し込みを追加する
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* モード選択済み or 既存なし → 以下表示 */}
              {enrollMode !== null && (
                <>
                  {/* モード表示バッジ */}
                  {hasExistingEnrollments && (
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        enrollMode === 'replace'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {enrollMode === 'replace' ? (
                          <><RefreshCw className="size-3" />置き換えモード</>
                        ) : (
                          <><Plus className="size-3" />追加モード</>
                        )}
                      </div>
                      <button
                        onClick={() => setEnrollMode(null)}
                        className="text-xs text-muted-foreground underline hover:text-slate-700"
                      >
                        変更する
                      </button>
                    </div>
                  )}

                  {/* 受講生情報 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="size-4" />受講生情報
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">氏名</span>
                        <span className="text-sm font-medium">{userName || '未設定'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">メール</span>
                        <span className="text-sm font-medium break-all">{userEmail}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 集団授業の確認 */}
                  {hasGroupCourses && groupCourses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <CalendarDays className="size-4 text-[#21B8C5]" />
                          集団授業（{groupCourses.length}講座）
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {groupCourses.map((course) => (
                          <div key={course.id} className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{course.name}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{course.subject}</span>
                                <span>{COURSE_TYPES[course.course_type as keyof typeof COURSE_TYPES]}</span>
                                {course.day_of_week && (
                                  <span>
                                    {course.day_of_week}曜{' '}
                                    {course.start_time && course.end_time
                                      ? `${formatTime(course.start_time)}~${formatTime(course.end_time)}`
                                      : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="shrink-0 font-semibold">{groupPricing.perCourse.toLocaleString()}円</p>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">小計</span>
                          <div className="text-right">
                            <span className="text-base font-bold text-[#1b99a4]">{groupPricing.total.toLocaleString()}円</span>
                            {groupPricing.isFlatRate && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 border border-green-200">会期定額制適用</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 個別指導の確認 */}
                  {hasIndividualSlots && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="size-4 text-[#8C5CC8]" />
                          個別指導
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-sm text-muted-foreground">受講可能時間帯</span>
                          <div className="mt-2 space-y-1.5">
                            {sortedSlots.map((slot) => (
                              <div key={slotKey(slot)} className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e0f4f8] border border-[#1b99a4]/20">
                                  <Clock className="size-3 text-[#1b99a4]" />
                                  <span className="font-bold text-[#1b99a4]">{slot.day}曜</span>
                                  <span className="text-slate-700">{slot.period}</span>
                                  <span className="text-xs text-muted-foreground">({getPeriodTime(slot.day, slot.period)})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">講座数</span>
                          <span className="text-sm font-medium">{courseCount}講座</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">教科</span>
                          <span className="text-sm font-medium">{subjectSummary}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">受講形態</span>
                          <span className="text-sm font-medium">{formatLabel}</span>
                        </div>
                        {friendName1 && (
                          <>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">友人1</span>
                              <span className="text-sm font-medium">{friendName1}</span>
                            </div>
                          </>
                        )}
                        {friendName2 && (
                          <>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">友人2</span>
                              <span className="text-sm font-medium">{friendName2}</span>
                            </div>
                          </>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">継続の有無</span>
                          <span className="text-sm font-medium">{continuation === 'continuation' ? '継続受講' : '新規受講'}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">小計</span>
                          <div className="text-right">
                            <span className="text-base font-bold text-[#1b99a4]">{individualTotalPrice.toLocaleString()}円/会期</span>
                            <p className="text-xs text-muted-foreground">{individualUnitPrice.toLocaleString()}円 × {courseCount}講座</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 支払い方法 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">お支払い方法</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{PAYMENT_METHODS[paymentMethod]}</p>
                    </CardContent>
                  </Card>

                  {/* 合計金額 */}
                  {(hasGroupCourses && hasIndividualSlots) && (
                    <Card className="border-[#1b99a4]/30 bg-[#e0f4f8]/20">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-slate-700">合計金額</p>
                          <p className="text-xl font-bold text-[#1b99a4]">{grandTotal.toLocaleString()}円</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSubmit} disabled={submitting} size="lg" className="min-w-[200px]">
                      {submitting ? (
                        <><Loader2 className="size-4 animate-spin" />送信中...</>
                      ) : (
                        '申し込む'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== Step: 完了 ===== */}
      {currentStepId === 'complete' && (
        <div className="flex justify-center py-8">
          <Card className="w-full max-w-lg text-center">
            <CardHeader className="items-center">
              <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">お申し込み完了</CardTitle>
              <CardDescription className="text-base">お申し込みありがとうございます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-slate-50 p-4 text-left">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">お申し込み内容</h3>
                <dl className="space-y-2 text-sm">
                  {hasGroupCourses && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">集団授業</dt>
                        <dd className="font-medium">{groupCourses.length}講座</dd>
                      </div>
                      {groupCourses.map((c) => (
                        <div key={c.id} className="flex justify-between pl-4">
                          <dt className="text-muted-foreground text-xs">{c.name}</dt>
                          <dd className="font-medium text-xs">{c.subject}</dd>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">集団授業 料金</dt>
                        <dd className="font-bold text-[#1b99a4]">{groupPricing.total.toLocaleString()}円</dd>
                      </div>
                    </>
                  )}
                  {hasIndividualSlots && (
                    <>
                      {hasGroupCourses && <Separator />}
                      <div>
                        <dt className="text-muted-foreground mb-1">個別指導 受講可能時間帯（{sortedSlots.length}コマ）</dt>
                        <dd className="space-y-1">
                          {sortedSlots.map((slot) => (
                            <div key={slotKey(slot)} className="font-medium">
                              {slot.day}曜 {slot.period} ({getPeriodTime(slot.day, slot.period)})
                            </div>
                          ))}
                        </dd>
                      </div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">講座数</dt><dd className="font-medium">{courseCount}講座</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">教科</dt><dd className="font-medium">{subjectSummary}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">形態</dt><dd className="font-medium">{formatLabel}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">個別指導 料金</dt><dd className="font-bold text-[#1b99a4]">{individualTotalPrice.toLocaleString()}円/会期</dd></div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">支払い方法</dt>
                    <dd className="font-medium">{PAYMENT_METHODS[paymentMethod]}</dd>
                  </div>
                  {hasGroupCourses && hasIndividualSlots && (
                    <div className="flex justify-between">
                      <dt className="font-bold text-slate-700">合計</dt>
                      <dd className="font-bold text-[#1b99a4] text-lg">{grandTotal.toLocaleString()}円</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left text-sm text-blue-800">
                <p>確認が完了次第、担当者よりご連絡いたします。</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild variant="outline"><Link href="/"><Home className="size-4" />トップページへ</Link></Button>
                <Button asChild><Link href="/student"><User className="size-4" />マイページへ</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ナビゲーションボタン ===== */}
      {currentStepId !== 'confirm' && currentStepId !== 'complete' && (
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleBack} disabled={stepIndex === 0}>
            <ArrowLeft className="size-4" />
            戻る
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            次へ
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
      {currentStepId === 'confirm' && !authChecking && !checkingExisting && enrollMode !== null && (
        <div className="flex items-center justify-start pt-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            戻る
          </Button>
        </div>
      )}
    </div>
  )
}
