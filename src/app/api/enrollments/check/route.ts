import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ログインが必要です。' },
        { status: 401 }
      )
    }

    // Get active term
    const { data: activeTerm } = await supabase
      .from('terms')
      .select('id, name')
      .eq('is_active', true)
      .single()

    if (!activeTerm) {
      return NextResponse.json({
        group: [],
        individual: [],
        termId: null,
        termName: null,
      })
    }

    // Get existing enrollments for this student in the active term
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, course_id, status, payment_amount, notes, course:courses(id, name, subject, target_grade)')
      .eq('student_id', user.id)
      .eq('term_id', activeTerm.id)
      .neq('status', 'cancelled')

    if (enrollError) {
      console.error('Enrollment check error:', enrollError)
      return NextResponse.json(
        { error: '申込情報の取得に失敗しました。' },
        { status: 500 }
      )
    }

    // Separate group (course_id is not null) and individual (course_id is null)
    const group = (enrollments ?? [])
      .filter((e) => e.course_id !== null)
      .map((e) => {
        const course = e.course as unknown as { id: string; name: string; subject: string; target_grade: string | null } | null
        return {
          id: e.id,
          courseId: e.course_id,
          courseName: course?.name ?? '',
          subject: course?.subject ?? '',
          targetGrade: course?.target_grade ?? null,
          paymentAmount: e.payment_amount,
          status: e.status,
        }
      })

    const individual = (enrollments ?? [])
      .filter((e) => e.course_id === null)
      .map((e) => {
        let parsed: Record<string, unknown> = {}
        try {
          if (e.notes) parsed = JSON.parse(e.notes)
        } catch { /* ignore */ }
        return {
          id: e.id,
          day: parsed.day as string ?? '',
          period: parsed.period as string ?? '',
          format: parsed.format as string ?? '',
          subjects: parsed.subjects as string[] ?? [],
          courseCount: parsed.courseCount as number ?? 0,
          paymentAmount: e.payment_amount,
          status: e.status,
        }
      })

    return NextResponse.json({
      group,
      individual,
      termId: activeTerm.id,
      termName: activeTerm.name,
    })
  } catch (error) {
    console.error('Enrollment check API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}
