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
import { COURSE_TYPES } from '@/lib/constants'
import { ArrowRight, List, CalendarDays, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'

// ============================================================
// 時限定義（時間割タブ用）
// ============================================================
const WEEKDAY_PERIODS = [
  { label: '1限', time: '15:30〜16:50' },
  { label: '2限', time: '17:00〜18:20' },
  { label: '3限', time: '18:30〜19:50' },
] as const

const SATURDAY_PERIODS = [
  { label: '1限', time: '13:10〜14:30' },
  { label: '2限', time: '14:40〜16:00' },
  { label: '3限', time: '16:10〜17:30' },
  { label: '4限', time: '17:40〜19:00' },
] as const

const WEEKDAYS = ['月', '火', '水', '木', '金'] as const

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  general:        { bg: '#e0f4f8', border: '#1b99a4', text: '#1b99a4', gradient: 'linear-gradient(135deg, #1b99a4, #21c5d3)' },
  recommendation: { bg: '#fff3e0', border: '#f6ad3c', text: '#e09520', gradient: 'linear-gradient(135deg, #f6ad3c, #f9c76b)' },
  ryugata:        { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32', gradient: 'linear-gradient(135deg, #4caf50, #66bb6a)' },
  junior:         { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0', gradient: 'linear-gradient(135deg, #2196f3, #42a5f5)' },
}

const CATEGORY_LABELS: Record<string, string> = {
  general: '一般', recommendation: '推薦', ryugata: '留型', junior: '中学',
}

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

interface CategoryInfo { id: string; slug: string; name: string }

const SENIOR_GRADE_CATEGORIES: Record<string, string[]> = {
  '高1': ['general', 'recommendation'],
  '高2': ['general', 'recommendation', 'ryugata'],
  '高3': ['general', 'recommendation'],
}
const SENIOR_GRADES = ['高3', '高2', '高1']
const JUNIOR_GRADES = ['中3', '中2', '中1']

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
  const totalPrice = selectedCourses.reduce((sum, c) => sum + c.price, 0)

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
    router.push(`/apply/login?${params.toString()}`)
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
        <Link href="/apply/individual">
          <Button variant="outline" className="gap-2 border-[#f6ad3c] text-[#e09520] hover:bg-[#fff3e0] whitespace-nowrap">
            <UserPlus className="size-4" />
            個別指導の申し込み
          </Button>
        </Link>
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
                                <p className="mt-1 text-sm text-slate-600">{course.description}</p>
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
                  className="px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                  style={
                    schoolTab === tab.key
                      ? { background: 'linear-gradient(135deg, #1b99a4, #21c5d3)', color: 'white', boxShadow: '0 4px 16px rgba(27,153,164,0.35)' }
                      : { backgroundColor: 'white', color: '#1b99a4', border: '2px solid #e0f4f8' }
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
                  className="px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                  style={
                    activeGrade === grade
                      ? { background: 'linear-gradient(135deg, #f6ad3c, #f9c76b)', color: 'white', boxShadow: '0 2px 10px rgba(246,173,60,0.35)' }
                      : { backgroundColor: '#f5f0e8', color: '#8b7355' }
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
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                        style={{ background: 'linear-gradient(135deg, #1b99a4, #21c5d3)', boxShadow: '0 8px 24px rgba(27,153,164,0.3)' }}
                      >
                        {grade}
                      </div>
                      <div>
                        <h2 className="text-xl font-black">{grade}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          {categorySlugs.map((s) => {
                            const c = CATEGORY_COLORS[s] ?? CATEGORY_COLORS.general
                            return (
                              <span key={s} className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
                                {CATEGORY_LABELS[s] ?? s}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex-1 h-[2px]" style={{ background: 'linear-gradient(90deg, #1b99a4 0%, rgba(27,153,164,0.1) 60%, transparent 100%)' }} />
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
                              <div className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: catColor.gradient }}>
                                {catLabel}
                              </div>
                              <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${catColor.border}50, transparent)` }} />
                            </div>
                          )}

                          {/* 平日テーブル */}
                          <div className="mb-6">
                            <h3 className="text-sm font-bold mb-2" style={{ color: catColor.text }}>月〜金曜日</h3>
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
                            <h3 className="text-sm font-bold mb-2" style={{ color: '#e09520' }}>土曜日</h3>
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
  catColor: { bg: string; border: string; text: string; gradient: string }
  selectedCourseIds: string[]
  onToggleCourse: (courseId: string) => void
}) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${catColor.border}25` }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '680px' }}>
          <thead>
            <tr>
              <th className="py-2 px-2 text-xs font-bold text-white text-center" style={{ background: catColor.gradient, width: '90px' }}>時限</th>
              {days.map((day) => (
                <th key={day} className="py-2 px-2 text-xs font-bold text-white text-center" style={{ background: catColor.gradient, minWidth: '110px' }}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, pi) => (
              <tr key={period.label} style={{ backgroundColor: pi % 2 === 0 ? 'white' : '#fafaf8' }}>
                <td className="py-2 px-2 text-center border-r" style={{ backgroundColor: `${catColor.bg}80`, borderRightColor: `${catColor.border}20` }}>
                  <div className="text-xs font-black" style={{ color: catColor.text }}>{period.label}</div>
                  <div className="text-[9px] text-muted-foreground">{period.time}</div>
                </td>
                {days.map((day) => {
                  const cellSlots = getSlots(filteredSlots, day, pi + 1)
                  return (
                    <td key={`${day}-${pi}`} className="p-1 align-top border-r last:border-r-0" style={{ borderRightColor: `${catColor.border}10` }}>
                      {cellSlots.length > 0 ? (
                        <div className="space-y-1">
                          {cellSlots.map((slot) => {
                            const slug = slot.course ? getCategorySlug(slot.course.category_id) : 'general'
                            const slotColor = CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.general
                            const isOpen = slot.course?.status === 'open'
                            const isSelected = selectedCourseIds.includes(slot.course_id)
                            return (
                              <div
                                key={slot.id}
                                onClick={() => isOpen && onToggleCourse(slot.course_id)}
                                className={`relative rounded-lg p-1.5 text-[10px] transition-all cursor-pointer hover:shadow-md`}
                                style={{
                                  backgroundColor: isSelected ? slotColor.bg : `${slotColor.bg}60`,
                                  border: isSelected ? `2px solid ${slotColor.border}` : `1px solid ${slotColor.border}30`,
                                }}
                              >
                                {isSelected && (
                                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: slotColor.gradient }}>
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                )}
                                <div className="font-bold text-[10px] leading-tight pr-4">{slot.course?.name ?? '未設定'}</div>
                                {slot.classroom && (
                                  <span className="inline-block mt-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: slotColor.bg, color: slotColor.text }}>
                                    {slot.classroom}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-3">
                          <div className="w-4 h-[2px] rounded-full" style={{ backgroundColor: `${catColor.border}15` }} />
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
  catColor: { bg: string; border: string; text: string; gradient: string }
  selectedCourseIds: string[]
  onToggleCourse: (courseId: string) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {periods.map((period, pi) => {
        const cellSlots = getSlots(filteredSlots, '土', pi + 1)
        return (
          <div key={period.label} className="rounded-xl overflow-hidden border" style={{ borderColor: `${catColor.border}20` }}>
            <div className="px-3 py-1.5 text-center" style={{ background: catColor.gradient }}>
              <div className="text-xs font-black text-white">{period.label}</div>
              <div className="text-[9px] text-white/80">{period.time}</div>
            </div>
            <div className="p-2 space-y-1" style={{ backgroundColor: 'white', minHeight: '50px' }}>
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
                      className="relative rounded-lg p-1.5 text-[10px] transition-all cursor-pointer hover:shadow-md"
                      style={{
                        backgroundColor: isSelected ? slotColor.bg : `${slotColor.bg}60`,
                        border: isSelected ? `2px solid ${slotColor.border}` : `1px solid ${slotColor.border}30`,
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: slotColor.gradient }}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                      <div className="font-bold text-[10px] leading-tight pr-4">{slot.course?.name ?? '未設定'}</div>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center py-2">
                  <div className="w-4 h-[2px] rounded-full" style={{ backgroundColor: `${catColor.border}15` }} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
