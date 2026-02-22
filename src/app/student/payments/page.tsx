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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/constants'
import type { Enrollment, Course, PaymentStatus, PaymentMethod } from '@/lib/types/database'
import { CreditCard, Calendar } from 'lucide-react'

type EnrollmentWithCourse = Enrollment & {
  course: Course
}

function getPaymentStatusVariant(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return 'default' as const
    case 'partial':
      return 'secondary' as const
    case 'unpaid':
      return 'destructive' as const
    case 'refunded':
      return 'outline' as const
    default:
      return 'secondary' as const
  }
}

function getPaymentStatusColor(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'unpaid':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'refunded':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return ''
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PaymentsPage() {
  const { user, supabase } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [activeTermName, setActiveTermName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchPayments = async () => {
      // アクティブな会期を取得
      const { data: activeTerm } = await supabase
        .from('terms')
        .select('id, name')
        .eq('is_active', true)
        .single()

      if (activeTerm) {
        setActiveTermName(activeTerm.name)
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false })

      if (!error && data) {
        // アクティブな会期でフィルタ
        let filtered = data as EnrollmentWithCourse[]
        if (activeTerm?.id) {
          filtered = filtered.filter((e) => e.course?.term_id === activeTerm.id)
        }
        setEnrollments(filtered)
      }
      setLoading(false)
    }

    fetchPayments()
  }, [user, supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支払い状況</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          各講座の支払い状況を確認できます
        </p>
        {activeTermName && (
          <div className="mt-2 flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <Badge variant="outline" className="text-xs font-medium">
              {activeTermName}
            </Badge>
          </div>
        )}
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
      ) : enrollments.length === 0 ? (
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
        <>
          {/* Desktop Table */}
          <Card className="hidden sm:block">
            <CardHeader>
              <CardTitle className="text-base">支払い一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>講座名</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>支払方法</TableHead>
                    <TableHead>支払期限</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.course?.name || '講座名未設定'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(enrollment.payment_amount)}
                      </TableCell>
                      <TableCell>
                        {enrollment.payment_method
                          ? PAYMENT_METHODS[enrollment.payment_method as PaymentMethod]
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {formatDate(enrollment.payment_due_date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPaymentStatusColor(enrollment.payment_status)}
                        >
                          {PAYMENT_STATUSES[enrollment.payment_status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="space-y-3 sm:hidden">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">
                      {enrollment.course?.name || '講座名未設定'}
                    </p>
                    <Badge
                      className={getPaymentStatusColor(enrollment.payment_status)}
                    >
                      {PAYMENT_STATUSES[enrollment.payment_status]}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">金額</p>
                      <p className="font-medium">
                        {formatCurrency(enrollment.payment_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">支払方法</p>
                      <p>
                        {enrollment.payment_method
                          ? PAYMENT_METHODS[enrollment.payment_method as PaymentMethod]
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">支払期限</p>
                      <p>{formatDate(enrollment.payment_due_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
