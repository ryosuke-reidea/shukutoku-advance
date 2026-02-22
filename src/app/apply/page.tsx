'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Course, CourseCategory } from '@/lib/types/database'
import { COURSE_TYPES } from '@/lib/constants'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function ApplyPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, coursesRes] = await Promise.all([
        supabase
          .from('course_categories')
          .select('*')
          .order('display_order'),
        supabase
          .from('courses')
          .select('*, category:course_categories(*)')
          .eq('status', 'open')
          .order('display_order'),
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (coursesRes.data) setCourses(coursesRes.data)
      setLoading(false)
    }

    fetchData()
  }, [])

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    )
  }

  const selectedCourses = courses.filter((c) =>
    selectedCourseIds.includes(c.id)
  )
  const totalPrice = selectedCourses.reduce((sum, c) => sum + c.price, 0)

  const handleNext = () => {
    if (selectedCourseIds.length === 0) return
    const params = new URLSearchParams()
    params.set('courses', selectedCourseIds.join(','))
    router.push(`/apply/login?${params.toString()}`)
  }

  const getCoursesByCategory = (categoryId: string) =>
    courses.filter((c) => c.category_id === categoryId)

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
        <h1 className="text-2xl font-bold text-slate-900">講座選択</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          受講したい講座を選択してください。複数選択が可能です。
        </p>
      </div>

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
                      className={
                        selectedCourseIds.includes(course.id)
                          ? 'border-primary bg-primary/5'
                          : ''
                      }
                    >
                      <CardContent className="flex items-start gap-4 py-4">
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={selectedCourseIds.includes(course.id)}
                          onCheckedChange={() => toggleCourse(course.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`course-${course.id}`}
                            className="cursor-pointer text-base font-semibold"
                          >
                            {course.name}
                          </Label>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>{course.subject}</span>
                            <span className="text-slate-300">|</span>
                            <span>
                              {COURSE_TYPES[course.course_type]}
                            </span>
                            {course.day_of_week && (
                              <>
                                <span className="text-slate-300">|</span>
                                <span>
                                  {course.day_of_week}曜{' '}
                                  {course.start_time &&
                                    course.end_time &&
                                    `${course.start_time}~${course.end_time}`}
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
                            <p className="mt-1 text-sm text-slate-600">
                              {course.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-lg font-bold text-slate-900">
                            {course.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            円
                          </span>
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

      {/* Fixed bottom bar */}
      <Card className="sticky bottom-4">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              選択中: {selectedCourseIds.length}講座
            </p>
            <p className="text-xl font-bold text-slate-900">
              合計: {totalPrice.toLocaleString()}円
            </p>
          </div>
          <Button
            onClick={handleNext}
            disabled={selectedCourseIds.length === 0}
            size="lg"
          >
            次へ
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
