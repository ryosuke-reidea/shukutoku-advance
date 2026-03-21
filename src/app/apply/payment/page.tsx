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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Course } from '@/lib/types/database'
import type { PaymentMethod } from '@/lib/types/database'
import { PAYMENT_METHODS } from '@/lib/constants'
import { ArrowRight, Loader2 } from 'lucide-react'
import { calculateGroupTotal, parsePricingConfig, GROUP_PRICE_PER_COURSE } from '@/lib/pricing'
import type { PricingConfig } from '@/lib/pricing'
import type { TuitionInfo } from '@/lib/types/database'

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>読み込み中...</p></div>}>
      <PaymentContent />
    </Suspense>
  )
}

function PaymentContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [loading, setLoading] = useState(true)
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const coursesParam = searchParams.get('courses') ?? ''
  const courseIds = coursesParam.split(',').filter(Boolean)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (courseIds.length === 0) {
        router.push('/apply')
        return
      }

      const [coursesRes, tuitionRes] = await Promise.all([
        supabase.from('courses').select('*').in('id', courseIds),
        supabase.from('tuition_info').select('*').order('display_order'),
      ])

      if (coursesRes.data) setCourses(coursesRes.data)
      if (tuitionRes.data) {
        setPricingConfig(parsePricingConfig(tuitionRes.data as TuitionInfo[]))
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // 料金計算（DB設定を使用）
  const grade = courses.length > 0 ? (courses[0]?.target_grade ?? null) : null
  const pricing = courses.length > 0
    ? calculateGroupTotal(courses.length, grade, pricingConfig ?? undefined)
    : { total: 0, isFlatRate: false, perCourse: pricingConfig?.groupPricePerCourse ?? GROUP_PRICE_PER_COURSE }

  const handleNext = () => {
    const params = new URLSearchParams()
    params.set('courses', coursesParam)
    params.set('payment', paymentMethod)
    router.push(`/apply/confirm?${params.toString()}`)
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">支払い方法の選択</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          お支払い方法を選択してください。
        </p>
      </div>

      {/* Selected courses summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">選択中の講座</CardTitle>
          <CardDescription>{courses.length}講座を選択中</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{course.name}</p>
                <p className="text-xs text-muted-foreground">{course.subject}</p>
              </div>
              <p className="text-sm font-semibold">
                {pricing.perCourse.toLocaleString()}円
              </p>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <p className="font-semibold">合計</p>
            <div className="text-right">
              <p className="text-lg font-bold">{pricing.total.toLocaleString()}円</p>
              {pricing.isFlatRate && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 border border-green-200 mt-1">
                  会期定額制適用
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment method selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">お支払い方法</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            {(
              Object.entries(PAYMENT_METHODS) as [PaymentMethod, string][]
            ).map(([value, label]) => (
              <div
                key={value}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-slate-50"
              >
                <RadioGroupItem value={value} id={`payment-${value}`} />
                <Label
                  htmlFor={`payment-${value}`}
                  className="flex-1 cursor-pointer font-medium"
                >
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          次へ
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
