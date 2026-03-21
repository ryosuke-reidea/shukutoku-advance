'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'
import {
  ALL_DAYS,
  WEEKDAY_PERIODS,
  SATURDAY_PERIODS,
  MAX_PERIODS,
  CATEGORY_COLORS,
  INDIVIDUAL_COLOR,
} from '@/lib/timetable-constants'
import {
  parseIndividualNotes,
  getIndividualSubjectDisplay,
  parsePeriodNumber,
} from '@/lib/enrollment-helpers'

import type { EnrollmentWithCourse, CategoryInfo, TutorAssignmentInfo } from '@/lib/types/shared-types'

interface StudentTimetableGridProps {
  enrollments: EnrollmentWithCourse[]
  categories: CategoryInfo[]
  individualEnrollments: EnrollmentWithCourse[]
  tutorAssignmentMap: Map<string, TutorAssignmentInfo[]>
  timetableSlotMap: Record<string, { day_of_week: string; period: number }>
  selectedTermName: string
}

// ============================================================
// ヘルパー関数
// ============================================================

/** 時限の開始時間から時限番号を推定 */
function estimatePeriodFromTime(startTime: string): number {
  const [h, m] = startTime.split(':').map(Number)
  const mins = h * 60 + m
  if (mins >= 18 * 60) return 3
  if (mins >= 16 * 60 + 30) return 2
  return 1
}

// ============================================================
// コンポーネント
// ============================================================
export function StudentTimetableGrid({
  enrollments,
  categories,
  individualEnrollments,
  tutorAssignmentMap,
  timetableSlotMap,
  selectedTermName,
}: StudentTimetableGridProps) {

  const getCategorySlug = (categoryId: string): string => {
    return categories.find((c) => c.id === categoryId)?.slug ?? 'general'
  }

  const getGridPosition = (enrollment: EnrollmentWithCourse): { day: string; period: number } | null => {
    if (!enrollment.course_id || !enrollment.course) {
      const notes = parseIndividualNotes(enrollment.notes)
      if (notes?.day && notes?.period) {
        return { day: notes.day, period: parsePeriodNumber(notes.period) }
      }
      return null
    }
    const slot = timetableSlotMap[enrollment.course_id]
    if (slot) {
      return { day: slot.day_of_week, period: slot.period }
    }
    if (enrollment.course.day_of_week) {
      const period = enrollment.course.start_time
        ? estimatePeriodFromTime(enrollment.course.start_time)
        : 1
      return { day: enrollment.course.day_of_week, period }
    }
    return null
  }

  const getPeriodInfo = (day: string, periodIdx: number) => {
    if (day === '土') return SATURDAY_PERIODS[periodIdx] || null
    return WEEKDAY_PERIODS[periodIdx] || null
  }

  const getCellEnrollments = (day: string, periodIdx: number) => {
    const groupInCell = enrollments.filter((enrollment) => {
      if (!enrollment.course_id || !enrollment.course) return false
      const pos = getGridPosition(enrollment)
      if (!pos) return false
      return pos.day === day && pos.period === (periodIdx + 1)
    })

    const individualMatchedInCell = enrollments.filter((enrollment) => {
      if (enrollment.course_id && enrollment.course) return false
      const assignments = tutorAssignmentMap.get(enrollment.id) || []
      if (assignments.length === 0) return false
      return assignments.some(
        (a) => a.confirmed_day === day && parsePeriodNumber(a.confirmed_period) === (periodIdx + 1)
      )
    })

    return [...groupInCell, ...individualMatchedInCell]
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="size-4 text-[#1b99a4]" />
          {selectedTermName} 時間割
        </CardTitle>
        <CardDescription>
          受講中の講座が時間割形式で表示されています
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 凡例 */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {categories.map((cat) => {
            const color = CATEGORY_COLORS[cat.slug] || CATEGORY_COLORS.general
            return (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border text-[10px]"
                style={{
                  backgroundColor: color.bg,
                  color: color.text,
                  borderColor: color.border + '40',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.border }} />
                {cat.name}
              </span>
            )
          })}
          {individualEnrollments.length > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border text-[10px]"
              style={{
                backgroundColor: INDIVIDUAL_COLOR.bg,
                color: INDIVIDUAL_COLOR.text,
                borderColor: INDIVIDUAL_COLOR.border + '40',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: INDIVIDUAL_COLOR.border }} />
              個別指導
            </span>
          )}
        </div>

        {/* グリッド */}
        <div className="overflow-x-auto">
          <div className="rounded-lg border overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <table className="w-full border-collapse" style={{ minWidth: '640px' }}>
              <thead>
                <tr>
                  <th className="bg-gray-800 text-white text-center font-bold py-2.5 px-2 text-sm" style={{ width: '64px' }}>
                    時限
                  </th>
                  {ALL_DAYS.map((day) => (
                    <th key={day} className="bg-gray-800 text-white text-center font-bold py-2.5 px-1.5 text-sm">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: MAX_PERIODS }, (_, periodIdx) => (
                  <tr key={periodIdx} className="border-t" style={{ backgroundColor: periodIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td className="text-center border-r bg-gray-50 py-3 px-1.5">
                      <div className="font-bold text-base">{periodIdx + 1}限</div>
                    </td>
                    {ALL_DAYS.map((day) => {
                      const periodInfo = getPeriodInfo(day, periodIdx)
                      if (!periodInfo) {
                        return (
                          <td key={`${day}-${periodIdx}`} className="border-r last:border-r-0 p-1 align-top" style={{ backgroundColor: '#f5f5f5' }}>
                            <div className="flex items-center justify-center h-full py-2">
                              <span className="text-xs text-gray-300">—</span>
                            </div>
                          </td>
                        )
                      }

                      const allCellEnrollments = getCellEnrollments(day, periodIdx)

                      return (
                        <td key={`${day}-${periodIdx}`} className="border-r last:border-r-0 p-1.5 align-top">
                          <div className="text-center mb-1 text-xs text-muted-foreground">
                            {periodInfo.time}
                          </div>
                          {allCellEnrollments.length > 0 ? (
                            <div className="space-y-1">
                              {allCellEnrollments.map((enrollment) => {
                                const isIndividual = !enrollment.course_id || !enrollment.course
                                const individualNotes = parseIndividualNotes(enrollment.notes)

                                if (isIndividual) {
                                  const assignments = tutorAssignmentMap.get(enrollment.id) || []
                                  const hasAssignment = assignments.length > 0
                                  return (
                                    <div
                                      key={enrollment.id}
                                      className="rounded-md border-l-[3px] p-2"
                                      style={{
                                        borderLeftColor: hasAssignment ? '#16a34a' : INDIVIDUAL_COLOR.border,
                                        backgroundColor: hasAssignment ? '#dcfce780' : INDIVIDUAL_COLOR.bg + '80',
                                      }}
                                    >
                                      <div className="font-bold text-xs leading-tight" style={{ color: hasAssignment ? '#16a34a' : INDIVIDUAL_COLOR.text }}>
                                        個別指導
                                        {hasAssignment && <span className="ml-1">✓</span>}
                                      </div>
                                      {individualNotes && (
                                        <div className="text-[11px] mt-0.5" style={{ color: hasAssignment ? '#15803d' : INDIVIDUAL_COLOR.text }}>
                                          {getIndividualSubjectDisplay(individualNotes)}
                                        </div>
                                      )}
                                      {hasAssignment && (
                                        <div className="text-[10px] mt-0.5 text-green-700 font-medium">
                                          担当: {assignments[0].tutor_name}
                                        </div>
                                      )}
                                    </div>
                                  )
                                }

                                const categorySlug = enrollment.course?.category_id ? getCategorySlug(enrollment.course.category_id) : 'general'
                                const color = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.general
                                const catName = categories.find((c) => c.id === enrollment.course?.category_id)?.name

                                return (
                                  <div
                                    key={enrollment.id}
                                    className="rounded-md border-l-[3px] p-2"
                                    style={{
                                      borderLeftColor: color.border,
                                      backgroundColor: color.bg + '60',
                                    }}
                                  >
                                    <div className="font-bold text-xs leading-tight">
                                      {enrollment.course?.name}
                                    </div>
                                    {catName && (
                                      <div className="text-[11px] mt-0.5 text-muted-foreground">
                                        {catName}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-1">
                              <div className="w-4 h-[1px] bg-gray-200 rounded" />
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
      </CardContent>
    </Card>
  )
}
