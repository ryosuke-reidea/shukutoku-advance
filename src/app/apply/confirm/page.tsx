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
import { AlertCircle, Loader2, User } from 'lucide-react'

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
        router.push(`/apply/login?courses=${coursesParam}`)
        return
      }

      setUserEmail(user.email ?? '')
      setUserName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '')

      const { data } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)

      if (data) setCourses(data)
      setLoading(false)
    }

    fetchData()
  }, [])

  const totalPrice = courses.reduce((sum, c) => sum + c.price, 0)

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
        <h1 className="text-2xl font-bold text-slate-900">お申し込み内容の確認</h1>
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

      {/* Student info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            受講生情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">氏名</span>
            <span className="text-sm font-medium">{userName || '未設定'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">メールアドレス</span>
            <span className="text-sm font-medium">{userEmail}</span>
          </div>
        </CardContent>
      </Card>

      {/* Selected courses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">選択した講座</CardTitle>
          <CardDescription>{courses.length}講座</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.map((course) => (
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
                          ? `${course.start_time}~${course.end_time}`
                          : ''}
                      </span>
                    )}
                  </div>
                </div>
                <p className="shrink-0 font-semibold">
                  {course.price.toLocaleString()}円
                </p>
              </div>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">合計金額</p>
            <p className="text-xl font-bold text-primary">
              {totalPrice.toLocaleString()}円
            </p>
          </div>
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
          className="min-w-[200px]"
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
    </div>
  )
}
