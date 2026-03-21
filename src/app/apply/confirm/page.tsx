'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Course, PaymentMethod } from '@/lib/types/database'
import { PAYMENT_METHODS, COURSE_TYPES } from '@/lib/constants'
import { AlertCircle, Loader2, User, RefreshCw, Plus, Info } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { calculateGroupTotal, parsePricingConfig, GROUP_PRICE_PER_COURSE } from '@/lib/pricing'
import type { PricingConfig } from '@/lib/pricing'
import type { TuitionInfo } from '@/lib/types/database'

interface ExistingGroupEnrollment {
  id: string
  courseId: string
  courseName: string
  subject: string
  targetGrade: string | null
  paymentAmount: number
  status: string
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>読み込み中...</p></div>}>
      <ConfirmContent />
    </Suspense>
  )
}

function ConfirmContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [existingGroup, setExistingGroup] = useState<ExistingGroupEnrollment[]>([])
  const [mode, setMode] = useState<'replace' | 'add' | null>(null)
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const coursesParam = searchParams.get('courses') ?? ''
  const paymentMethod = (searchParams.get('payment') ?? 'bank_transfer') as PaymentMethod
  const courseIds = coursesParam.split(',').filter(Boolean)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (courseIds.length === 0) {
        router.push('/apply')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 未ログインの場合、ログインページへ飛ばし、ログイン後に確認ページに戻る
        const returnUrl = `/apply/confirm?courses=${coursesParam}&payment=${paymentMethod}`
        router.push(`/apply/login?courses=${coursesParam}&payment=${paymentMethod}&next=${encodeURIComponent(returnUrl)}`)
        return
      }

      setUserEmail(user.email ?? '')
      setUserName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '')

      // コース情報 + 料金設定取得
      const [coursesRes, tuitionRes] = await Promise.all([
        supabase.from('courses').select('*').in('id', courseIds),
        supabase.from('tuition_info').select('*').order('display_order'),
      ])

      if (coursesRes.data) setCourses(coursesRes.data)
      if (tuitionRes.data) {
        setPricingConfig(parsePricingConfig(tuitionRes.data as TuitionInfo[]))
      }

      // 既存申込チェック
      try {
        const res = await fetch('/api/enrollments/check')
        if (res.ok) {
          const checkData = await res.json()
          if (checkData.group && checkData.group.length > 0) {
            setExistingGroup(checkData.group)
          } else {
            // 既存申込なし → 自動的にaddモード
            setMode('add')
          }
        } else {
          setMode('add')
        }
      } catch {
        setMode('add')
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // 料金計算
  const computePricing = () => {
    const grade = courses[0]?.target_grade ?? null

    if (mode === 'replace' || existingGroup.length === 0) {
      return calculateGroupTotal(courses.length, grade, pricingConfig ?? undefined)
    } else {
      const existingCourseIds = new Set(existingGroup.map((e) => e.courseId))
      const newCourses = courses.filter((c) => !existingCourseIds.has(c.id))
      const totalCount = existingGroup.length + newCourses.length
      return calculateGroupTotal(totalCount, grade, pricingConfig ?? undefined)
    }
  }

  const pricing = courses.length > 0 ? computePricing() : { total: 0, isFlatRate: false, perCourse: pricingConfig?.groupPricePerCourse ?? GROUP_PRICE_PER_COURSE }

  // 新規追加分のみの料金を計算
  const getNewCoursesInfo = () => {
    if (mode === 'replace' || existingGroup.length === 0) {
      return { newCourses: courses, newTotal: pricing.total }
    }
    const existingCourseIds = new Set(existingGroup.map((e) => e.courseId))
    const newCourses = courses.filter((c) => !existingCourseIds.has(c.id))
    return { newCourses, newTotal: newCourses.length * pricing.perCourse }
  }

  const { newCourses, newTotal } = courses.length > 0 ? getNewCoursesInfo() : { newCourses: courses, newTotal: 0 }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds,
          paymentMethod,
          mode: mode ?? 'add',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '申し込みに失敗しました。')
        setSubmitting(false)
        return
      }

      router.push(`/apply/complete?courses=${coursesParam}&payment=${paymentMethod}`)
    } catch {
      setError('ネットワークエラーが発生しました。もう一度お試しください。')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">お申し込み内容の確認</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          内容をご確認のうえ、お申し込みボタンを押してください。
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 既存申込がある場合の選択UI */}
      {existingGroup.length > 0 && mode === null && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-900">
              <Info className="size-4" />
              既存の申し込みがあります
            </CardTitle>
            <CardDescription className="text-amber-800">
              現在の会期に{existingGroup.length}講座の申し込みがあります。どのように処理しますか？
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 既存申込一覧 */}
            <div className="rounded-lg border border-amber-200 bg-white p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-900 mb-2">現在の申し込み：</p>
              {existingGroup.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{e.courseName}</span>
                  <span className="text-muted-foreground text-xs">{e.subject}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setMode('replace')}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-[#1b99a4] hover:bg-[#e0f4f8]/30"
              >
                <RefreshCw className="size-6 text-[#1b99a4]" />
                <span className="font-bold text-slate-900">すべて置き換える</span>
                <span className="text-xs text-muted-foreground text-center">
                  既存の申し込みをキャンセルし、<br />今回選択した講座のみにする
                </span>
              </button>
              <button
                onClick={() => setMode('add')}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-[#1b99a4] hover:bg-[#e0f4f8]/30"
              >
                <Plus className="size-6 text-[#1b99a4]" />
                <span className="font-bold text-slate-900">追加する</span>
                <span className="text-xs text-muted-foreground text-center">
                  既存の申し込みを残したまま、<br />新しい講座を追加する
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* モード選択済み or 既存申込なし → 以下を表示 */}
      {mode !== null && (
        <>
          {/* モード表示バッジ */}
          {existingGroup.length > 0 && (
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                mode === 'replace'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {mode === 'replace' ? (
                  <><RefreshCw className="size-3" />置き換えモード</>
                ) : (
                  <><Plus className="size-3" />追加モード</>
                )}
              </div>
              <button
                onClick={() => setMode(null)}
                className="text-xs text-muted-foreground underline hover:text-slate-700"
              >
                変更する
              </button>
            </div>
          )}

          {/* Student info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" />
                受講生情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground shrink-0">氏名</span>
                <span className="text-sm font-medium text-right">{userName || '未設定'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground shrink-0">メールアドレス</span>
                <span className="text-sm font-medium text-right break-all">{userEmail}</span>
              </div>
            </CardContent>
          </Card>

          {/* addモード + 既存ありの場合: 既存講座を表示 */}
          {mode === 'add' && existingGroup.length > 0 && (
            <Card className="border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base text-slate-700">既存の申し込み（{existingGroup.length}講座）</CardTitle>
                <CardDescription>これらの講座は引き続き有効です</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {existingGroup.map((e) => (
                  <div key={e.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{e.courseName}</p>
                      <p className="text-xs text-muted-foreground">{e.subject}</p>
                    </div>
                    <p className="shrink-0 text-sm text-slate-500">
                      {pricing.perCourse.toLocaleString()}円
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Selected courses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {mode === 'add' && existingGroup.length > 0 ? '新規追加する講座' : '選択した講座'}
              </CardTitle>
              <CardDescription>
                {mode === 'add' && existingGroup.length > 0
                  ? `${newCourses.length}講座を追加`
                  : `${courses.length}講座`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(mode === 'add' && existingGroup.length > 0 ? newCourses : courses).map((course) => (
                <div key={course.id} className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{course.subject}</span>
                        <span>{COURSE_TYPES[course.course_type]}</span>
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
                    <p className="shrink-0 font-semibold">
                      {pricing.perCourse.toLocaleString()}円
                    </p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">合計金額</p>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {pricing.total.toLocaleString()}円
                  </p>
                  {pricing.isFlatRate && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 border border-green-200 mt-1">
                      会期定額制適用
                    </span>
                  )}
                </div>
              </div>
              {mode === 'add' && existingGroup.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  ※ 既存{existingGroup.length}講座 + 新規{newCourses.length}講座 = 合計{existingGroup.length + newCourses.length}講座での料金です
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">お支払い方法</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{PAYMENT_METHODS[paymentMethod]}</p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="w-full sm:w-auto sm:min-w-[200px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  送信中...
                </>
              ) : (
                '申し込む'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
