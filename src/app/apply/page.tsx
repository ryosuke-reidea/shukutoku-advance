'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Course, CourseCategory } from '@/lib/types/database'
import { COURSE_TYPES, SENIOR_GRADE_CATEGORIES, SENIOR_GRADES, JUNIOR_GRADES } from '@/lib/constants'
import { ArrowRight, List, CalendarDays, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'
import {
  WEEKDAYS,
  WEEKDAY_PERIODS,
  SATURDAY_PERIODS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from '@/lib/timetable-constants'

interface TimetableSlot {
  id: string
  course_id: string
  day_of_week: string
  period: number
  start_time: string
  end_time: string
  classroom: string
  course: {
    name: string
    instructor_name: string | null
    target_grade: string | null
    subject: string
    course_type: string
    category_id: string
    price: number
    status: string
  } | null
}

import type { CategoryInfo } from '@/lib/types/shared-types'


export default function ApplyPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([])
  const [catInfos, setCatInfos] = useState<CategoryInfo[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'timetable'>('list')
  // Timetable state
  const [schoolTab, setSchoolTab] = useState<'senior' | 'junior'>('senior')
  const [activeGrade, setActiveGrade] = useState('高3')
  const gradeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // ページ表示時に最上部へスクロール
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      // まずアクティブな会期を取得
      const { data: activeTerm } = await supabase
        .from('terms')
        .select('id')
        .eq('is_active', true)
        .single()

      // 講座クエリ（会期でフィルタ）
      let coursesQuery = supabase.from('courses').select('*, category:course_categories(*)').eq('status', 'open').order('display_order')
      if (activeTerm?.id) {
        coursesQuery = coursesQuery.eq('term_id', activeTerm.id)
      }

      const [categoriesRes, coursesRes, slotsRes, catInfoRes] = await Promise.all([
        supabase.from('course_categories').select('*').order('display_order'),
        coursesQuery,
        supabase.from('timetable_slots')
          .select('*, course:courses(name, instructor_name, target_grade, subject, course_type, category_id, price, status, term_id)')
          .order('day_of_week').order('period'),
        supabase.from('course_categories').select('id, slug, name').order('display_order'),
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (coursesRes.data) setCourses(coursesRes.data)

      // 時間割スロットも会期でフィルタ（course.term_idで絞り込み）
      let filteredSlots = (slotsRes.data as TimetableSlot[]) ?? []
      if (activeTerm?.id) {
        filteredSlots = filteredSlots.filter(
          (slot) => (slot.course as Record<string, unknown>)?.term_id === activeTerm.id
        )
      }
      setTimetableSlots(filteredSlots)
      setCatInfos((catInfoRes.data as CategoryInfo[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const toggleCourse = useCallback((courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    )
  }, [])

  const selectedCourses = courses.filter((c) => selectedCourseIds.includes(c.id))

  // For timetable mode, also compute prices from timetable slots
  const timetableTotalPrice = (() => {
    const uniqueCourses = new Map<string, number>()
    timetableSlots.forEach((s) => {
      if (selectedCourseIds.includes(s.course_id) && s.course && !uniqueCourses.has(s.course_id)) {
        uniqueCourses.set(s.course_id, s.course.price)
      }
    })
    // Also include from courses list
    selectedCourses.forEach((c) => {
      if (!uniqueCourses.has(c.id)) uniqueCourses.set(c.id, c.price)
    })
    let sum = 0
    uniqueCourses.forEach((price) => { sum += price })
    return sum
  })()

  const handleNext = () => {
    if (selectedCourseIds.length === 0) return
    const params = new URLSearchParams()
    params.set('courses', selectedCourseIds.join(','))
    // 統合フローへ（個別指導もまとめて申し込み可能）
    router.push(`/apply/individual?${params.toString()}`)
  }

  const getCoursesByCategory = (categoryId: string) =>
    courses.filter((c) => c.category_id === categoryId)

  // Timetable helpers
  const getCategorySlug = useCallback((categoryId: string): string => {
    return catInfos.find((c) => c.id === categoryId)?.slug ?? 'general'
  }, [catInfos])

  const filterSlots = useCallback((grade: string, categorySlugs: string[]) => {
    const catIds = catInfos.filter((c) => categorySlugs.includes(c.slug)).map((c) => c.id)
    return timetableSlots.filter((slot) => {
      if (!slot.course) return false
      return slot.course.target_grade === grade && catIds.includes(slot.course.category_id)
    })
  }, [catInfos, timetableSlots])

  const getSlots = useCallback((slots: TimetableSlot[], day: string, period: number): TimetableSlot[] => {
    return slots.filter((s) => s.day_of_week === day && s.period === period)
  }, [])

  const handleSchoolTabChange = (tab: 'senior' | 'junior') => {
    setSchoolTab(tab)
    setActiveGrade(tab === 'senior' ? '高3' : '中3')
  }

  const scrollToGrade = (grade: string) => {
    setActiveGrade(grade)
    const el = gradeRefs.current[grade]
    if (el) {
      const offset = 300
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const currentGrades = schoolTab === 'senior' ? SENIOR_GRADES : JUNIOR_GRADES

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">講座選択</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            受講したい講座を選択してください。複数選択が可能です。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/apply/individual">
            <Button variant="outline" className="gap-2 whitespace-nowrap rounded-full" style={{ borderColor: '#8C5CC8', color: '#8C5CC8', borderWidth: '2px' }}>
              <UserPlus className="size-4" />
              個別指導の申し込み
            </Button>
          </Link>
          <Link href="/timetable">
            <Button variant="outline" className="gap-2 whitespace-nowrap rounded-full" style={{ borderColor: '#21B8C5', color: '#21B8C5', borderWidth: '2px' }}>
              <CalendarDays className="size-4" />
              時間割から選択
            </Button>
          </Link>
        </div>
      </div>

      {/* メインタブ: 講座一覧 / 時間割 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'timetable')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <List className="size-4" />
            講座一覧から選択
          </TabsTrigger>
          <TabsTrigger value="timetable" className="gap-2">
            <CalendarDays className="size-4" />
            時間割から選択
          </TabsTrigger>
        </TabsList>

        {/* ===== 講座一覧タブ ===== */}
        <TabsContent value="list">
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]?.id}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id}>
                  <div className="space-y-3">
                    {getCoursesByCategory(category.id).length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        現在、この区分で受付中の講座はありません。
                      </p>
                    ) : (
                      getCoursesByCategory(category.id).map((course) => (
                        <Card
                          key={course.id}
                          className={selectedCourseIds.includes(course.id) ? 'border-primary bg-primary/5' : ''}
                        >
                          <CardContent className="flex items-start gap-4 py-4">
                            <Checkbox
                              id={`course-${course.id}`}
                              checked={selectedCourseIds.includes(course.id)}
                              onCheckedChange={() => toggleCourse(course.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`course-${course.id}`} className="cursor-pointer text-base font-semibold">
                                {course.name}
                              </Label>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>{course.subject}</span>
                                <span className="text-slate-300">|</span>
                                <span>{COURSE_TYPES[course.course_type]}</span>
                                {course.day_of_week && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    <span>
                                      {course.day_of_week}曜{' '}
                                      {course.start_time && course.end_time &&
                                        `${formatTime(course.start_time)}~${formatTime(course.end_time)}`}
                                    </span>
                                  </>
                                )}
                                {course.instructor_name && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    <span>{course.instructor_name}</span>
                                  </>
                                )}
                              </div>
                              {course.description && (
                                <p className="mt-1 text-sm text-stone-500">{course.description}</p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-lg font-bold text-slate-900">{course.price.toLocaleString()}</span>
                              <span className="text-sm text-muted-foreground">円</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              現在、受付中の講座はありません。
            </p>
          )}
        </TabsContent>

        {/* ===== 時間割タブ ===== */}
        <TabsContent value="timetable">
          <div className="space-y-4">
            {/* School Tabs */}
            <div className="flex justify-center gap-3">
              {([
                { key: 'senior' as const, label: '高校' },
                { key: 'junior' as const, label: '中学' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleSchoolTabChange(tab.key)}
                  className="px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300"
                  style={
                    schoolTab === tab.key
                      ? { background: 'linear-gradient(135deg, #21B8C5, #42D8E8)', color: 'white', boxShadow: '0 4px 14px rgba(33,184,197,0.35)' }
                      : { backgroundColor: '#f0f8f9', color: '#21B8C5', border: '2px solid #21B8C530' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grade Pills */}
            <div className="flex justify-center gap-2">
              {currentGrades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => scrollToGrade(grade)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                  style={
                    activeGrade === grade
                      ? { background: 'linear-gradient(135deg, #21B8C5, #42D8E8)', color: 'white', boxShadow: '0 2px 10px rgba(33,184,197,0.30)' }
                      : { backgroundColor: '#f0f8f9', color: '#21B8C5', border: '1.5px solid #21B8C525' }
                  }
                >
                  {grade}
                </button>
              ))}
            </div>

            {/* Timetable Content */}
            <div className="space-y-16">
              {currentGrades.map((grade) => {
                const categorySlugs = schoolTab === 'senior' ? SENIOR_GRADE_CATEGORIES[grade] : ['junior']
                return (
                  <div key={grade} ref={(el) => { gradeRefs.current[grade] = el }} className="scroll-mt-36">
                    {/* Grade Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base"
                        style={{ background: 'linear-gradient(135deg, #21B8C5, #42D8E8)', boxShadow: '0 6px 20px rgba(33,184,197,0.30)' }}
                      >
                        {grade}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold" style={{ color: '#2A2A2A' }}>{grade}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                          {categorySlugs.map((s) => {
                            const c = CATEGORY_COLORS[s] ?? CATEGORY_COLORS.general
                            return (
                              <span key={s} className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: c.gradient, color: 'white' }}>
                                {CATEGORY_LABELS[s] ?? s}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #21B8C530, transparent)' }} />
                    </div>

                    {/* Per category timetable */}
                    {categorySlugs.map((catSlug) => {
                      const filteredSlots = filterSlots(grade, [catSlug])
                      const catColor = CATEGORY_COLORS[catSlug] ?? CATEGORY_COLORS.general
                      const catLabel = CATEGORY_LABELS[catSlug] ?? catSlug
                      const showCategoryLabel = categorySlugs.length > 1

                      return (
                        <div key={catSlug} className="mb-10 last:mb-0">
                          {showCategoryLabel && (
                            <div className="flex items-center gap-3 mb-4">
                              <div className="px-4 py-2 rounded-full text-sm font-bold shadow-sm" style={{ background: catColor.gradient, color: 'white', boxShadow: `0 2px 8px ${catColor.border}25` }}>
                                {catLabel}
                              </div>
                              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${catColor.border}30, transparent)` }} />
                            </div>
                          )}

                          {/* 平日テーブル */}
                          <div className="mb-6">
                            <h3 className="text-sm font-semibold mb-2 text-stone-500">月〜金曜日</h3>
                            <MiniTimetable
                              days={[...WEEKDAYS]}
                              periods={[...WEEKDAY_PERIODS]}
                              filteredSlots={filteredSlots}
                              getSlots={getSlots}
                              getCategorySlug={getCategorySlug}
                              catColor={catColor}
                              selectedCourseIds={selectedCourseIds}
                              onToggleCourse={toggleCourse}
                            />
                          </div>

                          {/* 土曜テーブル */}
                          <div>
                            <h3 className="text-sm font-semibold mb-2 text-stone-500">土曜日</h3>
                            <MiniSaturday
                              periods={[...SATURDAY_PERIODS]}
                              filteredSlots={filteredSlots}
                              getSlots={getSlots}
                              getCategorySlug={getCategorySlug}
                              catColor={catColor}
                              selectedCourseIds={selectedCourseIds}
                              onToggleCourse={toggleCourse}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Fixed bottom bar */}
      <Card className="sticky bottom-4">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              選択中: {selectedCourseIds.length}講座
            </p>
            <p className="text-xl font-bold text-slate-900">
              合計: {timetableTotalPrice.toLocaleString()}円
            </p>
          </div>
          <Button onClick={handleNext} disabled={selectedCourseIds.length === 0} size="lg">
            次へ
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// ミニ時間割テーブル（申し込みページ用）
// ============================================================
function MiniTimetable({
  days, periods, filteredSlots, getSlots, getCategorySlug, catColor, selectedCourseIds, onToggleCourse,
}: {
  days: string[]
  periods: readonly { label: string; time: string }[]
  filteredSlots: TimetableSlot[]
  getSlots: (slots: TimetableSlot[], day: string, period: number) => TimetableSlot[]
  getCategorySlug: (categoryId: string) => string
  catColor: { bg: string; border: string; text: string; gradient: string; headerBg: string; headerText: string }
  selectedCourseIds: string[]
  onToggleCourse: (courseId: string) => void
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${catColor.border}20`, boxShadow: `0 2px 12px ${catColor.border}08` }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '680px' }}>
          <thead>
            <tr>
              <th className="py-3 px-2 text-xs font-bold text-center tracking-wide border-r" style={{ background: catColor.gradient, color: 'white', width: '90px', borderRightColor: 'rgba(255,255,255,0.25)' }}>時限</th>
              {days.map((day, i) => (
                <th key={day} className={`py-3 px-2 text-xs font-bold text-center tracking-wide ${i < days.length - 1 ? 'border-r' : ''}`} style={{ background: catColor.gradient, color: 'white', minWidth: '110px', borderRightColor: 'rgba(255,255,255,0.25)' }}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, pi) => (
              <tr key={period.label} style={{ backgroundColor: pi % 2 === 0 ? 'white' : '#f8fafb', borderTop: `1px solid ${catColor.border}12` }}>
                <td className="py-3 px-2 text-center border-r" style={{ backgroundColor: pi % 2 === 0 ? `${catColor.bg}50` : `${catColor.bg}30`, borderRightColor: `${catColor.border}15` }}>
                  <div className="text-sm font-bold" style={{ color: catColor.text }}>{period.label}</div>
                  <div className="text-[11px] text-stone-400">{period.time}</div>
                </td>
                {days.map((day, dayIdx) => {
                  const cellSlots = getSlots(filteredSlots, day, pi + 1)
                  return (
                    <td key={`${day}-${pi}`} className={`p-2 align-top ${dayIdx < days.length - 1 ? 'border-r' : ''}`} style={{ borderRightColor: `${catColor.border}10` }}>
                      {cellSlots.length > 0 ? (
                        <div className="space-y-1.5">
                          {cellSlots.map((slot) => {
                            const slug = slot.course ? getCategorySlug(slot.course.category_id) : 'general'
                            const slotColor = CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.general
                            const isOpen = slot.course?.status === 'open'
                            const isSelected = selectedCourseIds.includes(slot.course_id)
                            return (
                              <div
                                key={slot.id}
                                onClick={() => isOpen && onToggleCourse(slot.course_id)}
                                className="relative py-2 px-2.5 text-xs transition-all duration-200 cursor-pointer rounded-lg hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                style={{
                                  backgroundColor: isSelected ? slotColor.bg : slotColor.bg,
                                  border: `2px solid ${isSelected ? slotColor.border : `${slotColor.border}35`}`,
                                  boxShadow: isSelected ? `0 4px 14px ${slotColor.border}30` : `0 1px 6px ${slotColor.border}10`,
                                  minHeight: '40px',
                                }}
                              >
                                {isSelected && (
                                  <div className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center text-white shadow-sm" style={{ background: slotColor.gradient, width: '16px', height: '16px' }}>
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                )}
                                <div className="font-bold text-xs leading-tight pr-4" style={{ color: slotColor.text }}>{slot.course?.name ?? '未設定'}</div>
                                {slot.classroom && (
                                  <div className="text-[10px] font-medium mt-0.5" style={{ color: `${slotColor.text}bb` }}>{slot.classroom}</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-3">
                          <div className="w-4 h-px rounded-full bg-stone-200" />
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// ミニ土曜コンパクト
// ============================================================
function MiniSaturday({
  periods, filteredSlots, getSlots, getCategorySlug, catColor, selectedCourseIds, onToggleCourse,
}: {
  periods: readonly { label: string; time: string }[]
  filteredSlots: TimetableSlot[]
  getSlots: (slots: TimetableSlot[], day: string, period: number) => TimetableSlot[]
  getCategorySlug: (categoryId: string) => string
  catColor: { bg: string; border: string; text: string; gradient: string; headerBg: string; headerText: string }
  selectedCourseIds: string[]
  onToggleCourse: (courseId: string) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {periods.map((period, pi) => {
        const cellSlots = getSlots(filteredSlots, '土', pi + 1)
        return (
          <div key={period.label} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${catColor.border}20`, boxShadow: `0 2px 8px ${catColor.border}08` }}>
            <div className="px-3 py-2.5 text-center" style={{ background: catColor.gradient }}>
              <div className="text-sm font-bold text-white">{period.label}</div>
              <div className="text-[11px] text-white/80">{period.time}</div>
            </div>
            <div className="p-2 space-y-1.5" style={{ backgroundColor: 'white', minHeight: '56px' }}>
              {cellSlots.length > 0 ? (
                cellSlots.map((slot) => {
                  const slug = slot.course ? getCategorySlug(slot.course.category_id) : 'general'
                  const slotColor = CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.general
                  const isOpen = slot.course?.status === 'open'
                  const isSelected = selectedCourseIds.includes(slot.course_id)
                  return (
                    <div
                      key={slot.id}
                      onClick={() => isOpen && onToggleCourse(slot.course_id)}
                      className="relative py-2 px-2.5 text-xs transition-all duration-200 cursor-pointer rounded-lg hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      style={{
                        backgroundColor: isSelected ? slotColor.bg : slotColor.bg,
                        border: `2px solid ${isSelected ? slotColor.border : `${slotColor.border}35`}`,
                        boxShadow: isSelected ? `0 4px 14px ${slotColor.border}30` : `0 1px 6px ${slotColor.border}10`,
                        minHeight: '40px',
                      }}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center text-white shadow-sm" style={{ background: slotColor.gradient, width: '16px', height: '16px' }}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                      <div className="font-bold text-xs leading-tight pr-4" style={{ color: slotColor.text }}>{slot.course?.name ?? '未設定'}</div>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center py-2">
                  <div className="w-4 h-px rounded-full bg-stone-200" />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
