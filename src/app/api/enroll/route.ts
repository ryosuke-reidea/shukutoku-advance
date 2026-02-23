import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_PAYMENT_METHODS = ['bank_transfer', 'account_transfer_lump', 'account_transfer_installment']

export async function POST(request: Request) {
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

    // Validate domain
    const email = user.email ?? ''
    if (!email.endsWith('@shukutoku.ed.jp')) {
      return NextResponse.json(
        { error: '@shukutoku.ed.jp のメールアドレスでログインしてください。' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // ============================================================
    // 個別指導の申し込み
    // ============================================================
    if (body.type === 'individual') {
      const { slots, subjects, courseCount, format, friendNames, paymentMethod } = body
      // 後方互換: 旧APIの subject (単数) もサポート
      const subjectList: string[] = Array.isArray(subjects) ? subjects : (body.subject ? [body.subject] : [])

      if (!Array.isArray(slots) || slots.length === 0) {
        return NextResponse.json(
          { error: '時間帯を選択してください。' },
          { status: 400 }
        )
      }

      if (subjectList.length === 0) {
        return NextResponse.json(
          { error: '教科を選択してください。' },
          { status: 400 }
        )
      }

      const validFormats = ['individual_1on1', 'individual_1on2', 'individual_1on3']
      if (!validFormats.includes(format)) {
        return NextResponse.json(
          { error: '有効な受講形態を選択してください。' },
          { status: 400 }
        )
      }

      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return NextResponse.json(
          { error: '有効な支払い方法を選択してください。' },
          { status: 400 }
        )
      }

      // Get active term
      const { data: activeTerm } = await supabase
        .from('terms')
        .select('id')
        .eq('is_active', true)
        .single()

      // Create enrollment records for each slot
      const enrollments = slots.map((slot: { day: string; period: string }) => ({
        student_id: user.id,
        course_id: null,
        term_id: activeTerm?.id ?? null,
        status: 'pending' as const,
        payment_method: paymentMethod,
        payment_status: 'unpaid' as const,
        payment_amount: 0,
        notes: JSON.stringify({
          type: 'individual',
          day: slot.day,
          period: slot.period,
          subjects: subjectList,
          courseCount: courseCount ?? subjectList.length,
          format,
          friendNames: friendNames ?? [],
        }),
      }))

      const { error: insertError } = await supabase
        .from('enrollments')
        .insert(enrollments)

      if (insertError) {
        console.error('Individual enrollment insert error:', insertError)
        return NextResponse.json(
          { error: '申し込みの登録に失敗しました。' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '個別指導の申し込みが完了しました。',
        enrollmentCount: enrollments.length,
      })
    }

    // ============================================================
    // 集団授業の申し込み
    // ============================================================
    const { courseIds, paymentMethod } = body

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: '講座を選択してください。' },
        { status: 400 }
      )
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: '有効な支払い方法を選択してください。' },
        { status: 400 }
      )
    }

    // Fetch courses to get prices
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, price, status')
      .in('id', courseIds)

    if (coursesError || !courses) {
      return NextResponse.json(
        { error: '講座情報の取得に失敗しました。' },
        { status: 500 }
      )
    }

    // Validate all courses exist and are open
    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: '選択された講座の一部が見つかりません。' },
        { status: 400 }
      )
    }

    const closedCourses = courses.filter((c) => c.status !== 'open')
    if (closedCourses.length > 0) {
      return NextResponse.json(
        { error: '受付終了した講座が含まれています。' },
        { status: 400 }
      )
    }

    // Check for existing enrollments
    const { data: existingEnrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id)
      .in('course_id', courseIds)
      .neq('status', 'cancelled')

    if (existingEnrollments && existingEnrollments.length > 0) {
      return NextResponse.json(
        { error: '既に申し込み済みの講座が含まれています。' },
        { status: 400 }
      )
    }

    // Create enrollments
    const enrollments = courses.map((course) => ({
      student_id: user.id,
      course_id: course.id,
      status: 'pending' as const,
      payment_method: paymentMethod,
      payment_status: 'unpaid' as const,
      payment_amount: course.price,
    }))

    const { error: insertError } = await supabase
      .from('enrollments')
      .insert(enrollments)

    if (insertError) {
      console.error('Enrollment insert error:', insertError)
      return NextResponse.json(
        { error: '申し込みの登録に失敗しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '申し込みが完了しました。',
      enrollmentCount: enrollments.length,
    })
  } catch (error) {
    console.error('Enroll API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}
