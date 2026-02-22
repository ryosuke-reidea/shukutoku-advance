'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  COURSE_TYPES,
  ENROLLMENT_STATUSES,
  PAYMENT_STATUSES,
} from '@/lib/constants'
import type { Enrollment, Course, EnrollmentStatus, PaymentStatus } from '@/lib/types/database'
import { BookOpen, Clock, MapPin, Plus } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type EnrollmentWithCourse = Enrollment & {
  course: Course
}

function getEnrollmentBadgeVariant(status: EnrollmentStatus) {
  switch (status) {
    case 'confirmed':
      return 'default' as const
    case 'pending':
      return 'secondary' as const
    case 'cancelled':
      return 'destructive' as const
    case 'completed':
      return 'outline' as const
    default:
      return 'secondary' as const
  }
}

function getPaymentBadgeVariant(status: PaymentStatus) {
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

export default function StudentDashboardPage() {
  const { user, profile, supabase } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchEnrollments = async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false })

      if (!error && data) {
        setEnrollments(data as EnrollmentWithCourse[])
      }
      setLoading(false)
    }

    fetchEnrollments()
  }, [user, supabase])

  const displayName = profile?.display_name || '受講生'

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{displayName}さん、こんにちは</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            受講中の講座を確認できます
          </p>
        </div>
        <Button asChild>
          <Link href="/apply">
            <Plus className="size-4" />
            追加受講を申し込む
          </Link>
        </Button>
      </div>

      {/* Enrollments */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">まだ講座に登録されていません</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              追加受講を申し込んで講座に参加しましょう
            </p>
            <Button asChild className="mt-4">
              <Link href="/apply">
                <Plus className="size-4" />
                追加受講を申し込む
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course
            return (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <Badge variant={getEnrollmentBadgeVariant(enrollment.status)}>
                      {ENROLLMENT_STATUSES[enrollment.status]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {course.subject} / {COURSE_TYPES[course.course_type]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.day_of_week && course.start_time && course.end_time && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4 shrink-0" />
                      <span>
                        {course.day_of_week}曜日 {formatTime(course.start_time)}〜{formatTime(course.end_time)}
                      </span>
                    </div>
                  )}
                  {course.classroom && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0" />
                      <span>{course.classroom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">支払い:</span>
                    <Badge
                      variant={getPaymentBadgeVariant(enrollment.payment_status)}
                      className="text-xs"
                    >
                      {PAYMENT_STATUSES[enrollment.payment_status]}
                    </Badge>
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
