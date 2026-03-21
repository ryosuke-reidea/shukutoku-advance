import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  calculateGroupTotal,
  calculateIndividualTotal,
} from '@/lib/pricing'
import { fetchPricingConfig } from '@/lib/pricing-server'

const VALID_PAYMENT_METHODS = ['bank_transfer', 'installment_1', 'installment_2']

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    // RLSを回避するサービスロールクライアント（enrollments書き込み用）
    const adminDb = createServiceRoleClient()

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
    const mode: 'replace' | 'add' = body.mode ?? 'add'

    // Get active term
    const { data: activeTerm } = await supabase
      .from('terms')
      .select('id')
      .eq('is_active', true)
      .single()

    const termId = activeTerm?.id ?? null

    // DBから料金設定を取得
    const pricingConfig = await fetchPricingConfig()

    // ============================================================
    // 個別指導の申し込み
    // ============================================================
    if (body.type === 'individual') {
      const { slots, subjects, courseCount, format, friendNames, paymentMethod, continuation } = body
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

      // replaceモード: 既存の個別enrollment(course_id IS NULL)を削除
      if (mode === 'replace') {
        const { error: deleteError } = await adminDb
          .from('enrollments')
          .delete()
          .eq('student_id', user.id)
          .is('course_id', null)

        if (deleteError) {
          console.error('Individual replace mode delete error:', deleteError)
        }
      }

      // 料金計算（DB設定を使用）
      const effectiveCourseCount = courseCount ?? subjectList.length
      const totalPrice = calculateIndividualTotal(format, effectiveCourseCount, pricingConfig)

      // Create enrollment records for each slot
      const enrollments = slots.map((slot: { day: string; period: string }, index: number) => ({
        student_id: user.id,
        course_id: null,
        term_id: termId,
        status: 'pending' as const,
        payment_method: paymentMethod,
        payment_status: 'unpaid' as const,
        // 1件目に合計額を設定、残りは0
        payment_amount: index === 0 ? totalPrice : 0,
        notes: JSON.stringify({
          type: 'individual',
          day: slot.day,
          period: slot.period,
          slots,
          subjects: subjectList,
          courseCount: effectiveCourseCount,
          format,
          friendNames: friendNames ?? [],
          continuation: continuation ?? 'new',
          term_id: termId,
        }),
      }))

      const { error: insertError } = await adminDb
        .from('enrollments')
        .insert(enrollments)

      if (insertError) {
        console.error('Individual enrollment insert error:', insertError)
        return NextResponse.json(
          { error: `個別指導の登録に失敗しました: ${insertError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '個別指導の申し込みが完了しました。',
        enrollmentCount: enrollments.length,
        totalPrice,
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

    // Fetch courses to get info
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, price, status, target_grade')
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

    // replaceモードの場合
    if (mode === 'replace') {
      // ユニーク制約 (student_id, course_id) に対応:
      // 挿入予定のcourse_idsに一致する既存レコードを全削除（term_id/status問わず）
      const { error: deleteError } = await adminDb
        .from('enrollments')
        .delete()
        .eq('student_id', user.id)
        .in('course_id', courseIds)

      if (deleteError) {
        console.error('Replace mode delete error:', deleteError)
      }

      // さらに同会期の他の集団enrollmentも削除（完全置き換え）
      if (termId) {
        await adminDb
          .from('enrollments')
          .delete()
          .eq('student_id', user.id)
          .eq('term_id', termId)
          .not('course_id', 'is', null)
      }
      // replaceの場合は全て新規登録するので重複チェック不要
    } else {
      // addモードの場合: 重複チェック（重複はスキップ、エラーにしない）
      const { data: existingEnrollments } = await adminDb
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .in('course_id', courseIds)
        .neq('status', 'cancelled')

      const existingCourseIds = new Set(
        (existingEnrollments ?? []).map((e) => e.course_id)
      )

      // 重複をフィルタ
      const newCourseIds = courseIds.filter((id: string) => !existingCourseIds.has(id))
      if (newCourseIds.length === 0) {
        return NextResponse.json(
          { error: '新規で追加する講座がありません（全て申し込み済み）。' },
          { status: 400 }
        )
      }

      // coursesも新規分だけに絞る
      const filteredCourses = courses.filter((c) => newCourseIds.includes(c.id))

      // addモードの合計講座数 = 既存 + 新規
      const existingGroupCount = existingCourseIds.size
      const totalCourseCount = existingGroupCount + filteredCourses.length

      // 学年を取得（コースのtarget_gradeから）
      const grade = courses[0]?.target_grade ?? null

      // 料金計算（DB設定を使用）
      const pricing = calculateGroupTotal(totalCourseCount, grade, pricingConfig)

      // 新規分のenrollmentを作成
      const enrollments = filteredCourses.map((course) => ({
        student_id: user.id,
        course_id: course.id,
        term_id: termId,
        status: 'pending' as const,
        payment_method: paymentMethod,
        payment_status: 'unpaid' as const,
        payment_amount: pricing.perCourse,
        notes: null,
      }))

      const { error: insertError } = await adminDb
        .from('enrollments')
        .insert(enrollments)

      if (insertError) {
        console.error('Enrollment insert error (add mode):', insertError)
        return NextResponse.json(
          { error: `集団授業の登録に失敗しました: ${insertError.message}` },
          { status: 500 }
        )
      }

      // addモードで定額適用になった場合、既存enrollmentのpayment_amountも更新
      if (pricing.isFlatRate && existingGroupCount > 0 && termId) {
        const existingIds = (existingEnrollments ?? [])
          .map((e) => e.course_id)
          .filter(Boolean) as string[]

        if (existingIds.length > 0) {
          // 既存の集団enrollmentを取得
          const { data: existingRecords } = await adminDb
            .from('enrollments')
            .select('id')
            .eq('student_id', user.id)
            .eq('term_id', termId)
            .in('course_id', existingIds)
            .neq('status', 'cancelled')

          if (existingRecords && existingRecords.length > 0) {
            const existingEnrollmentIds = existingRecords.map((r) => r.id)
            await adminDb
              .from('enrollments')
              .update({ payment_amount: pricing.perCourse })
              .in('id', existingEnrollmentIds)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: '申し込みが完了しました。',
        enrollmentCount: enrollments.length,
        totalPrice: pricing.total,
        isFlatRate: pricing.isFlatRate,
      })
    }

    // replaceモードの場合の新規登録処理
    // 学年を取得
    const grade = courses[0]?.target_grade ?? null
    const totalCourseCount = courses.length
    const pricing = calculateGroupTotal(totalCourseCount, grade, pricingConfig)

    // Create enrollments using upsert to handle any remaining constraint conflicts
    const enrollments = courses.map((course) => ({
      student_id: user.id,
      course_id: course.id,
      term_id: termId,
      status: 'pending' as const,
      payment_method: paymentMethod,
      payment_status: 'unpaid' as const,
      payment_amount: pricing.perCourse,
      notes: null,
    }))

    const { error: insertError } = await adminDb
      .from('enrollments')
      .upsert(enrollments, { onConflict: 'student_id,course_id' })

    if (insertError) {
      console.error('Enrollment insert error (replace mode):', insertError)
      return NextResponse.json(
        { error: `集団授業の登録に失敗しました: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '申し込みが完了しました。',
      enrollmentCount: enrollments.length,
      totalPrice: pricing.total,
      isFlatRate: pricing.isFlatRate,
    })
  } catch (error) {
    console.error('Enroll API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}
