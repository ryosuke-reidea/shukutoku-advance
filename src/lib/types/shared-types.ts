/**
 * 共有拡張型定義
 * ⚠️ SHARED FILE: このファイルは shukutoku-advance と admin-shukutoku-advance で同期が必要です
 * 変更時は両方のプロジェクトに反映してください
 *
 * database.ts の基本型をベースに、Supabase の JOIN クエリ結果に対応する拡張型を定義
 */

import type { Enrollment, Course, Profile, CourseCategory } from './database'

// --- Enrollment 拡張型 ---

/** course リレーション付き（集団授業の受講データ） */
export type EnrollmentWithCourse = Enrollment & { course: Course }

/** student リレーション付き（講座詳細の受講者一覧） */
export type EnrollmentWithStudent = Enrollment & { student: Profile }

/** student + course リレーション付き（受講一覧の完全データ） */
export type EnrollmentWithRelations = Enrollment & { student: Profile; course: Course }

/** course に category を含む拡張型（生徒詳細ページ用） */
export type EnrollmentWithCourseAndCategory = Enrollment & {
  course: (Course & { category: CourseCategory }) | null
}

// --- カテゴリ情報 ---

/** CourseCategory の軽量版（一覧表示・フィルタ用） */
export type CategoryInfo = Pick<CourseCategory, 'id' | 'slug' | 'name'>

// --- チューターアサイン表示用 ---

/** 確定済みマッチング情報（生徒ページ表示用） */
export interface TutorAssignmentInfo {
  tutor_name: string
  confirmed_day: string
  confirmed_period: string
}
