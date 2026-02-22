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
import { DAYS_OF_WEEK } from '@/lib/constants'
import type { ClassroomAssignment, Course } from '@/lib/types/database'
import { DoorOpen, Calendar } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type AssignmentWithCourse = ClassroomAssignment & {
  course: Course
}

export default function ClassroomPage() {
  const { supabase } = useAuth()
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([])
  const [activeTermName, setActiveTermName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignments = async () => {
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
        .from('classroom_assignments')
        .select('*, course:courses(*)')
        .order('start_time', { ascending: true })

      if (!error && data) {
        // アクティブな会期でフィルタ
        let filtered = data as AssignmentWithCourse[]
        if (activeTerm?.id) {
          filtered = filtered.filter((a) => a.course?.term_id === activeTerm.id)
        }
        setAssignments(filtered)
      }
      setLoading(false)
    }

    fetchAssignments()
  }, [supabase])

  // Group assignments by day of week
  const assignmentsByDay = DAYS_OF_WEEK.reduce(
    (acc, day) => {
      acc[day] = assignments.filter((a) => a.day_of_week === day)
      return acc
    },
    {} as Record<string, AssignmentWithCourse[]>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">教室割一覧</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          各講座の教室と時間を確認できます
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-1/3 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DoorOpen className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">教室割がまだ登録されていません</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              教室割が登録されるとここに表示されます
            </p>
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
                    <Badge variant="outline" className="text-sm">
                      {day}曜日
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dayAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-lg border bg-accent/30 p-3"
                      >
                        <p className="font-medium text-sm">
                          {assignment.course?.name || '講座名未設定'}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {formatTime(assignment.start_time)}〜{formatTime(assignment.end_time)}
                          </span>
                          <span className="font-medium text-foreground">
                            {assignment.classroom}
                          </span>
                        </div>
                        {assignment.notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {assignment.notes}
                          </p>
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
  )
}
