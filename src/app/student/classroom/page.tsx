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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DAYS_OF_WEEK } from '@/lib/constants'
import type { ClassroomAssignment, Course, Enrollment } from '@/lib/types/database'
import { DoorOpen, Calendar, BookOpen, Clock, MapPin } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type AssignmentWithCourse = ClassroomAssignment & {
  course: Course
}

type EnrollmentWithCourse = Enrollment & {
  course: Course | null
}

interface Term {
  id: string
  name: string
  is_active: boolean
}

export default function ClassroomPage() {
  const { user, supabase } = useAuth()
  const [allAssignments, setAllAssignments] = useState<AssignmentWithCourse[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // 会期一覧を取得
      const { data: termsData } = await supabase
        .from('terms')
        .select('id, name, is_active')
        .order('created_at', { ascending: false })

      if (termsData) {
        setTerms(termsData as Term[])
        const activeTerm = termsData.find((t: Term) => t.is_active)
        if (activeTerm) {
          setSelectedTermId(activeTerm.id)
        } else if (termsData.length > 0) {
          setSelectedTermId(termsData[0].id)
        }
      }

      // サイネージ表示用の全教室割を取得
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('classroom_assignments')
        .select('*, course:courses(*)')
        .order('start_time', { ascending: true })

      if (!assignmentError && assignmentData) {
        setAllAssignments(assignmentData as AssignmentWithCourse[])
      }

      // 自分の登録情報（教室情報付き）を取得
      if (user) {
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*, course:courses(*)')
          .eq('student_id', user.id)
          .order('enrolled_at', { ascending: false })

        if (!enrollmentError && enrollmentData) {
          setEnrollments(enrollmentData as EnrollmentWithCourse[])
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [user, supabase])

  // 選択された会期でフィルタ
  const assignments = allAssignments.filter((a) =>
    selectedTermId ? a.course?.term_id === selectedTermId : true
  )

  const myEnrollments = enrollments.filter((e) => {
    if (!e.course) return false
    return selectedTermId ? e.course.term_id === selectedTermId : true
  })

  // Group assignments by day
  const assignmentsByDay = DAYS_OF_WEEK.reduce(
    (acc, day) => {
      acc[day] = assignments.filter((a) => a.day_of_week === day)
      return acc
    },
    {} as Record<string, AssignmentWithCourse[]>
  )

  const selectedTermName = terms.find((t) => t.id === selectedTermId)?.name ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">教室割一覧</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          あなたの受講講座と全体の教室割を確認できます
        </p>
      </div>

      {/* Term Selector */}
      {terms.length > 0 && (
        <div className="flex items-center gap-3">
          <Calendar className="size-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-muted-foreground shrink-0">会期:</span>
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="会期を選択" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}{term.is_active ? ' (現在)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-5 w-1/3 rounded bg-muted" /></CardHeader>
              <CardContent><div className="space-y-3"><div className="h-4 w-full rounded bg-muted" /><div className="h-4 w-2/3 rounded bg-muted" /></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* あなたの受講講座の教室 */}
          {myEnrollments.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
                <BookOpen className="size-4 text-[#1b99a4]" />
                あなたの受講講座
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myEnrollments.map((enrollment) => {
                  const course = enrollment.course!
                  return (
                    <Card key={enrollment.id} className="border-l-4 border-l-[#1b99a4]">
                      <CardContent className="pt-4 pb-3 space-y-2">
                        <p className="font-medium text-sm">{course.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {course.day_of_week && course.start_time && course.end_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {course.day_of_week}曜 {formatTime(course.start_time)}〜{formatTime(course.end_time)}
                            </span>
                          )}
                          {course.classroom && (
                            <span className="flex items-center gap-1 font-semibold text-[#1b99a4]">
                              <MapPin className="size-3" />
                              {course.classroom}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {myEnrollments.length > 0 && assignments.length > 0 && <Separator />}

          {/* 全体の教室割（サイネージ） */}
          <div>
            <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
              <DoorOpen className="size-4 text-amber-600" />
              全体の教室割{selectedTermName ? `（${selectedTermName}）` : ''}
            </h2>
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <DoorOpen className="mb-4 size-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">教室割がまだ登録されていません</h3>
                  <p className="mt-1 text-sm text-muted-foreground">教室割が登録されるとここに表示されます</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {DAYS_OF_WEEK.map((day) => {
                  const dayAssignments = assignmentsByDay[day]
                  if (dayAssignments.length === 0) return null
                  return (
                    <Card key={day}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          <Badge variant="outline" className="text-sm">{day}曜日</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {dayAssignments.map((assignment) => (
                            <div key={assignment.id} className="rounded-lg border bg-accent/30 p-3">
                              <p className="font-medium text-sm">{assignment.course?.name || '講座名未設定'}</p>
                              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>{formatTime(assignment.start_time)}〜{formatTime(assignment.end_time)}</span>
                                <span className="font-medium text-foreground">{assignment.classroom}</span>
                              </div>
                              {assignment.notes && (
                                <p className="mt-1.5 text-xs text-muted-foreground">{assignment.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
