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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { COURSE_TYPES, ENROLLMENT_STATUSES } from '@/lib/constants'
import { BookOpen, Clock, MapPin, Plus, Calendar, GraduationCap, CircleDollarSign, CheckCircle2, CalendarDays, List, UserCheck } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import {
  parseIndividualNotes,
  getIndividualSubjectDisplay,
  INDIVIDUAL_FORMAT_LABELS,
  getEnrollmentBadgeVariant,
  formatCurrency,
} from '@/lib/enrollment-helpers'
import { StudentTimetableGrid } from '@/components/student-timetable-grid'

import type { EnrollmentWithCourse, CategoryInfo, TutorAssignmentInfo } from '@/lib/types/shared-types'

// ============================================================
// 型定義
// ============================================================

interface Term {
  id: string
  name: string
  is_active: boolean
}

interface TimetableSlotRow {
  id: string
  course_id: string
  day_of_week: string
  period: number
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function StudentDashboardPage() {
  const { user, profile, supabase } = useAuth()
  const [allEnrollments, setAllEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [timetableSlotMap, setTimetableSlotMap] = useState<Record<string, { day_of_week: string; period: number }>>({})
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [tutorAssignmentMap, setTutorAssignmentMap] = useState<Map<string, TutorAssignmentInfo[]>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      // 全会期を取得
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

      // 全登録を取得
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false })

      const enrollmentData = (!error && data) ? data as EnrollmentWithCourse[] : []
      setAllEnrollments(enrollmentData)

      // カテゴリ取得
      const { data: catData } = await supabase
        .from('course_categories')
        .select('id, slug, name')
        .order('display_order')
      if (catData) {
        setCategories(catData as CategoryInfo[])
      }

      // 個別指導のenrollmentに対してtutor_assignmentsを取得
      const individualEnrollmentIds = enrollmentData
        .filter((e) => !e.course_id)
        .map((e) => e.id)

      if (individualEnrollmentIds.length > 0) {
        const { data: assignmentsData } = await supabase
          .from('tutor_assignments')
          .select('enrollment_id, confirmed_day, confirmed_period, status, tutor:profiles!tutor_assignments_tutor_id_fkey(display_name)')
          .in('enrollment_id', individualEnrollmentIds)
          .eq('status', 'confirmed')

        if (assignmentsData) {
          const aMap = new Map<string, TutorAssignmentInfo[]>()
          for (const a of assignmentsData as unknown as { enrollment_id: string; confirmed_day: string; confirmed_period: string; tutor: { display_name: string } | { display_name: string }[] | null }[]) {
            if (!aMap.has(a.enrollment_id)) aMap.set(a.enrollment_id, [])
            const tutorObj = Array.isArray(a.tutor) ? a.tutor[0] : a.tutor
            aMap.get(a.enrollment_id)!.push({
              tutor_name: tutorObj?.display_name || '不明',
              confirmed_day: a.confirmed_day,
              confirmed_period: a.confirmed_period,
            })
          }
          setTutorAssignmentMap(aMap)
        }
      }

      // timetable_slotsから受講講座のcourse_idでスロット情報を取得
      const courseIds = enrollmentData
        .map((e) => e.course_id)
        .filter((id): id is string => id !== null)

      if (courseIds.length > 0) {
        const { data: slotsData } = await supabase
          .from('timetable_slots')
          .select('id, course_id, day_of_week, period')
          .in('course_id', courseIds)

        if (slotsData) {
          const slotMap: Record<string, { day_of_week: string; period: number }> = {}
          for (const slot of slotsData as TimetableSlotRow[]) {
            slotMap[slot.course_id] = { day_of_week: slot.day_of_week, period: slot.period }
          }
          setTimetableSlotMap(slotMap)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [user, supabase])

  // 選択された会期でフィルタ
  const enrollments = allEnrollments.filter((e) => {
    if (!selectedTermId) return true
    if (!e.course) {
      if (e.term_id) return e.term_id === selectedTermId
      try {
        const notes = e.notes ? JSON.parse(e.notes) : {}
        if (notes.term_id) return notes.term_id === selectedTermId
      } catch { /* ignore */ }
      return true
    }
    return e.course.term_id === selectedTermId
  })

  const selectedTermName = terms.find((t) => t.id === selectedTermId)?.name ?? ''
  const displayName = profile?.display_name || '受講生'

  // 集団と個別に分離
  const groupEnrollments = enrollments.filter((e) => e.course)
  const individualEnrollments = enrollments.filter((e) => !e.course)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-xl bg-gradient-to-r from-[#1b99a4] to-[#21c5d3] p-5 sm:p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{displayName}さん、こんにちは</h1>
            <p className="mt-1 text-sm text-white/80">受講中の講座を確認できます</p>
          </div>
          <Button asChild className="bg-white text-[#1b99a4] hover:bg-white/90 font-bold shadow-lg">
            <Link href="/apply">
              <Plus className="size-4" />
              追加受講を申し込む
            </Link>
          </Button>
        </div>
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

      {/* Summary Cards */}
      {!loading && enrollments.length > 0 && (
        <SummaryCards
          groupCount={groupEnrollments.length}
          individualCount={individualEnrollments.length}
          enrollments={enrollments}
        />
      )}

      {/* Enrollments */}
      {loading ? (
        <LoadingSkeleton />
      ) : enrollments.length === 0 ? (
        <EmptyState selectedTermName={selectedTermName} />
      ) : (
        <Tabs defaultValue="timetable">
          <TabsList>
            <TabsTrigger value="timetable" className="text-xs sm:text-sm">
              <CalendarDays className="size-3.5 mr-1.5" />
              時間割
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs sm:text-sm">
              <List className="size-3.5 mr-1.5" />
              リスト
            </TabsTrigger>
          </TabsList>

          {/* 時間割グリッド表示 */}
          <TabsContent value="timetable" className="mt-4">
            <StudentTimetableGrid
              enrollments={enrollments}
              categories={categories}
              individualEnrollments={individualEnrollments}
              tutorAssignmentMap={tutorAssignmentMap}
              timetableSlotMap={timetableSlotMap}
              selectedTermName={selectedTermName}
            />
          </TabsContent>

          {/* リスト表示 */}
          <TabsContent value="list" className="mt-4">
            <EnrollmentListView
              groupEnrollments={groupEnrollments}
              individualEnrollments={individualEnrollments}
              tutorAssignmentMap={tutorAssignmentMap}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// ============================================================
// サブコンポーネント
// ============================================================

function SummaryCards({
  groupCount,
  individualCount,
  enrollments,
}: {
  groupCount: number
  individualCount: number
  enrollments: EnrollmentWithCourse[]
}) {
  const totalAmount = enrollments.reduce((sum, e) => sum + (e.payment_amount || 0), 0)
  const allPaid = enrollments.every((e) => e.payment_status === 'paid')

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Card className="border-[#1b99a4]/20">
        <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-[#1b99a4]/10 flex items-center justify-center shrink-0">
            <BookOpen className="size-5 text-[#1b99a4]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1b99a4]">{groupCount}</p>
            <p className="text-xs text-muted-foreground">集団授業</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-purple-200">
        <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <GraduationCap className="size-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{individualCount}</p>
            <p className="text-xs text-muted-foreground">個別指導</p>
          </div>
        </CardContent>
      </Card>
      <Card className={`col-span-2 sm:col-span-1 ${allPaid ? 'border-green-200' : 'border-orange-200'}`}>
        <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${allPaid ? 'bg-green-100' : 'bg-orange-100'}`}>
            {allPaid
              ? <CheckCircle2 className="size-5 text-green-600" />
              : <CircleDollarSign className="size-5 text-orange-600" />
            }
          </div>
          <div>
            <p className={`text-lg font-bold ${allPaid ? 'text-green-600' : 'text-orange-600'}`}>
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {allPaid ? '支払い済み' : '授業料金'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
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
  )
}

function EmptyState({ selectedTermName }: { selectedTermName: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="mb-4 size-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">
          {selectedTermName ? `${selectedTermName}の登録はありません` : 'まだ講座に登録されていません'}
        </h3>
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
  )
}

function EnrollmentListView({
  groupEnrollments,
  individualEnrollments,
  tutorAssignmentMap,
}: {
  groupEnrollments: EnrollmentWithCourse[]
  individualEnrollments: EnrollmentWithCourse[]
  tutorAssignmentMap: Map<string, TutorAssignmentInfo[]>
}) {
  return (
    <div className="space-y-6">
      {/* 集団授業 */}
      {groupEnrollments.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-[#1b99a4]" />
            集団授業
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupEnrollments.map((enrollment) => {
              const course = enrollment.course
              return (
                <Card key={enrollment.id} className="hover:shadow-md transition-shadow border-l-4 border-l-[#1b99a4]">
                  <CardHeader className="pb-2">
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
                  <CardContent className="space-y-2">
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
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 個別指導 */}
      {individualEnrollments.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <GraduationCap className="size-4 text-purple-600" />
            個別指導
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {individualEnrollments.map((enrollment) => {
              const notes = parseIndividualNotes(enrollment.notes)
              const subjectDisplay = getIndividualSubjectDisplay(notes)
              const slots = notes?.slots ?? (notes?.day && notes?.period ? [{ day: notes.day, period: notes.period }] : [])
              const assignments = tutorAssignmentMap.get(enrollment.id) || []
              const hasAssignment = assignments.length > 0

              return (
                <Card key={enrollment.id} className={`hover:shadow-md transition-shadow border-l-4 ${hasAssignment ? 'border-l-green-500' : 'border-l-purple-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">個別指導</CardTitle>
                      {hasAssignment ? (
                        <Badge className="bg-green-600">確定済</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">マッチング待ち</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {subjectDisplay || '個別指導'} / {notes?.format ? INDIVIDUAL_FORMAT_LABELS[notes.format] ?? notes.format : '個別'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* 担当講師情報 */}
                    {hasAssignment && (
                      <div className="rounded-md bg-green-50 border border-green-200 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                          <UserCheck className="size-4 shrink-0" />
                          担当講師: {assignments[0].tutor_name}
                        </div>
                        <div className="flex flex-wrap gap-1.5 ml-5">
                          {assignments.map((a, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 border border-green-300 text-xs"
                            >
                              <span className="font-bold text-green-700">{a.confirmed_day}曜</span>
                              <span className="text-green-600">{a.confirmed_period}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 未マッチの場合のみ希望スロットを表示 */}
                    {!hasAssignment && slots.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Clock className="size-3.5 shrink-0" />
                          <span>希望時間帯:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map((slot: { day: string; period: string }, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-xs"
                            >
                              <span className="font-bold text-purple-700">{slot.day}曜</span>
                              <span className="text-purple-600">{slot.period}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {notes?.courseCount && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="size-4 shrink-0" />
                        <span>{notes?.courseCount}講座</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
