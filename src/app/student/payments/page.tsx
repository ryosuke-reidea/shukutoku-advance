'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/constants'
import type { Enrollment, Course, PaymentStatus, PaymentMethod } from '@/lib/types/database'
import { CreditCard, Calendar, CircleDollarSign, BookOpen, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatCurrency, getIndividualSubjectDisplay, parseIndividualNotes } from '@/lib/enrollment-helpers'

type EnrollmentWithCourse = Enrollment & {
  course: Course | null
}

interface Term {
  id: string
  name: string
  is_active: boolean
}

interface TermPaymentSummary {
  term: Term
  enrollments: EnrollmentWithCourse[]
  totalAmount: number
  isPaid: boolean
  paymentMethod: PaymentMethod | null
}

function getPaymentStatusColor(isPaid: boolean) {
  return isPaid
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-red-100 text-red-800 border-red-200'
}

function getEnrollmentName(enrollment: EnrollmentWithCourse): string {
  if (enrollment.course) return enrollment.course.name
  const notes = parseIndividualNotes(enrollment.notes ?? null)
  if (notes) {
    const subjects = getIndividualSubjectDisplay(notes)
    return `個別指導${subjects ? `（${subjects}）` : ''}`
  }
  return '個別指導'
}

export default function PaymentsPage() {
  const { user, supabase } = useAuth()
  const [termSummaries, setTermSummaries] = useState<TermPaymentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchPayments = async () => {
      // 全会期を取得
      const { data: termsData } = await supabase
        .from('terms')
        .select('id, name, is_active')
        .order('created_at', { ascending: false })

      // 全enrollment取得
      const { data: enrollmentsData, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', user.id)
        .neq('status', 'cancelled')
        .order('enrolled_at', { ascending: false })

      if (!error && enrollmentsData && termsData) {
        const enrollments = enrollmentsData as EnrollmentWithCourse[]
        const terms = termsData as Term[]

        // 会期ごとにenrollmentをグループ化
        const summaries: TermPaymentSummary[] = []

        for (const term of terms) {
          const termEnrollments = enrollments.filter((e) => {
            if (e.term_id === term.id) return true
            if (!e.course && e.notes) {
              try {
                const notes = JSON.parse(e.notes)
                return notes.term_id === term.id
              } catch { /* ignore */ }
            }
            return e.course?.term_id === term.id
          })

          if (termEnrollments.length === 0) continue

          const totalAmount = termEnrollments.reduce((sum, e) => sum + (e.payment_amount || 0), 0)
          // 会期の支払いが完了しているかどうか: 全enrollmentがpaidなら支払い済み
          const isPaid = termEnrollments.every((e) => e.payment_status === 'paid')
          // 支払い方法は会期内で統一されているはず（最初のものを使用）
          const paymentMethod = termEnrollments[0]?.payment_method ?? null

          summaries.push({
            term,
            enrollments: termEnrollments,
            totalAmount,
            isPaid,
            paymentMethod,
          })
        }

        setTermSummaries(summaries)
      }
      setLoading(false)
    }

    fetchPayments()
  }, [user, supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">授業料金・支払い状況</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          各会期ごとの授業料金と支払い状況を確認できます
        </p>
      </div>

      {loading ? (
        <Card className="animate-pulse">
          <CardContent className="py-8">
            <div className="space-y-4">
              <div className="h-6 w-full rounded bg-muted" />
              <div className="h-6 w-full rounded bg-muted" />
              <div className="h-6 w-full rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ) : termSummaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">支払い情報がありません</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              講座に登録すると支払い情報がここに表示されます
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {termSummaries.map((summary) => {
            const groupEnrollments = summary.enrollments.filter((e) => e.course)
            const individualEnrollments = summary.enrollments.filter((e) => !e.course)

            return (
              <Card key={summary.term.id} className={summary.isPaid ? 'border-green-200' : 'border-orange-200'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-5 text-primary" />
                      <CardTitle className="text-lg">
                        {summary.term.name}
                        {summary.term.is_active && (
                          <Badge variant="outline" className="ml-2 text-xs">現在</Badge>
                        )}
                      </CardTitle>
                    </div>
                    <Badge className={getPaymentStatusColor(summary.isPaid)}>
                      {summary.isPaid ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          支払い済み
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          未払い
                        </span>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 授業料金 */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <CircleDollarSign className="size-6 text-slate-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">授業料金（会期合計）</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
                      </div>
                    </div>
                    {summary.paymentMethod && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">支払い方法</p>
                        <p className="text-sm font-medium">
                          {PAYMENT_METHODS[summary.paymentMethod as keyof typeof PAYMENT_METHODS] || summary.paymentMethod}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* 受講講座一覧 */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">受講講座</p>
                    <div className="space-y-2">
                      {groupEnrollments.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 text-sm">
                          <BookOpen className="size-3.5 text-[#1b99a4] shrink-0" />
                          <span>{e.course?.name}</span>
                          {e.course?.subject && (
                            <span className="text-xs text-muted-foreground">({e.course.subject})</span>
                          )}
                        </div>
                      ))}
                      {individualEnrollments.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 text-sm">
                          <GraduationCap className="size-3.5 text-purple-600 shrink-0" />
                          <span>{getEnrollmentName(e)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      計 {summary.enrollments.length} 講座
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
