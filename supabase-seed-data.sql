-- ============================================================
-- 淑徳アドバンス Seed Data for Supabase SQL Editor
-- Run this AFTER the schema has been applied (supabase-schema.sql)
-- This file is idempotent: safe to run multiple times
-- ============================================================

-- Enable pgcrypto for crypt() / gen_salt()
create extension if not exists pgcrypto;

-- ============================================================
-- 0. CLEANUP: Remove existing seed data if re-running
--    (deletes cascade through FKs)
-- ============================================================
do $$
begin
  -- Delete auth users with our fixed UUIDs (cascades to profiles + all FKs)
  delete from auth.users where id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
  );

  -- Delete seed courses by fixed UUIDs
  delete from public.courses where id in (
    -- Original c-series
    'c1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
    'c4444444-4444-4444-4444-444444444444',
    'c5555555-5555-5555-5555-555555555555',
    'c6666666-6666-6666-6666-666666666666',
    'c7777777-7777-7777-7777-777777777777',
    'c8888888-8888-8888-8888-888888888888',
    'c9999999-9999-9999-9999-999999999999',
    'ca111111-1111-1111-1111-111111111111',
    'cb222222-2222-2222-2222-222222222222',
    'cc333333-3333-3333-3333-333333333333',
    'cd444444-4444-4444-4444-444444444444',
    'ce555555-5555-5555-5555-555555555555',
    'cf666666-6666-6666-6666-666666666666',
    -- New d-series
    'd1111111-1111-1111-1111-111111111111',
    'd2222222-2222-2222-2222-222222222222',
    'd3333333-3333-3333-3333-333333333333',
    'd4444444-4444-4444-4444-444444444444',
    'd5555555-5555-5555-5555-555555555555',
    'd6666666-6666-6666-6666-666666666666',
    'd7777777-7777-7777-7777-777777777777',
    'd8888888-8888-8888-8888-888888888888',
    'd9999999-9999-9999-9999-999999999999',
    'da111111-1111-1111-1111-111111111111',
    'db222222-2222-2222-2222-222222222222',
    'dc333333-3333-3333-3333-333333333333',
    'dd444444-4444-4444-4444-444444444444',
    'de555555-5555-5555-5555-555555555555',
    'df666666-6666-6666-6666-666666666666',
    -- New e-series
    'e1111111-1111-1111-1111-111111111111',
    'e2222222-2222-2222-2222-222222222222',
    'e3333333-3333-3333-3333-333333333333',
    'e4444444-4444-4444-4444-444444444444',
    'e5555555-5555-5555-5555-555555555555',
    'e6666666-6666-6666-6666-666666666666',
    'e7777777-7777-7777-7777-777777777777',
    'e8888888-8888-8888-8888-888888888888',
    'e9999999-9999-9999-9999-999999999999',
    'ea111111-1111-1111-1111-111111111111',
    'eb222222-2222-2222-2222-222222222222'
  );

  -- Delete seed front_content, contact_submissions, announcements, student_usage_notes, tuition_info
  delete from public.front_content where section in ('hero', 'about', 'merits');
  delete from public.contact_submissions where email in ('yamamoto@example.com', 'kobayashi@example.com', 'tanaka.parent@example.com', 'sato.inquiry@example.com');
  delete from public.announcements where title in ('2024年度 夏期講習のお知らせ', '教室利用ルールの変更について', '新任講師のご紹介', '年末年始の休業日について');
  delete from public.student_usage_notes where title in ('自習室の利用について', '欠席・遅刻の連絡方法', '教材の取り扱い', '緊急時の連絡先');
  delete from public.tuition_info where label in ('一般集団授業（高1・高2）', '一般集団授業（高3）', '推薦対策講座', '留型クラス', '中学生集団授業', '個別指導（1:1）', '個別指導（1:2）');
end $$;

-- ============================================================
-- 1. AUTH USERS
--    The on_auth_user_created trigger will auto-create profiles
--    using raw_user_meta_data->>'role' and ->>'display_name'
-- ============================================================

-- 1-1. Admin
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'admin@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "admin", "display_name": "管理者太郎"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-2. Instructor 1: 山田先生
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'yamada@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "instructor", "display_name": "山田先生"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-3. Instructor 2: 鈴木先生
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'suzuki@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "instructor", "display_name": "鈴木先生"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-4. Instructor 3: 田中先生
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'tanaka@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "instructor", "display_name": "田中先生"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-5. Tutor 1: 佐藤チューター
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000000',
  'sato@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "tutor", "display_name": "佐藤チューター"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-6. Tutor 2: 伊藤チューター
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '00000000-0000-0000-0000-000000000000',
  'ito@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "tutor", "display_name": "伊藤チューター"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-7. Student 1: 高橋花子
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'student1@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "student", "display_name": "高橋花子"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-8. Student 2: 渡辺太郎
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'student2@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "student", "display_name": "渡辺太郎"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-9. Student 3: 中村さくら
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '00000000-0000-0000-0000-000000000000',
  'student3@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "student", "display_name": "中村さくら"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-10. Student 4: 小林優斗
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '00000000-0000-0000-0000-000000000000',
  'student4@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "student", "display_name": "小林優斗"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1-11. Student 5: 加藤美咲
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '00000000-0000-0000-0000-000000000000',
  'student5@shukutoku.ed.jp',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "student", "display_name": "加藤美咲"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Also insert identity records so Supabase auth works properly
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub": "11111111-1111-1111-1111-111111111111", "email": "admin@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub": "22222222-2222-2222-2222-222222222222", "email": "yamada@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub": "33333333-3333-3333-3333-333333333333", "email": "suzuki@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '{"sub": "44444444-4444-4444-4444-444444444444", "email": "tanaka@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '{"sub": "55555555-5555-5555-5555-555555555555", "email": "sato@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '{"sub": "66666666-6666-6666-6666-666666666666", "email": "ito@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "email": "student1@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "email": "student2@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc", "email": "student3@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"sub": "dddddddd-dddd-dddd-dddd-dddddddddddd", "email": "student4@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"sub": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "email": "student5@shukutoku.ed.jp"}'::jsonb, 'email', now(), now(), now())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. UPDATE PROFILES with extra fields
--    (trigger already created the base profile rows)
-- ============================================================

-- Admin profile
UPDATE public.profiles SET
  phone = '03-1234-5678'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Instructor profiles
UPDATE public.profiles SET
  phone = '090-1111-2222'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET
  phone = '090-3333-4444'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET
  phone = '090-5555-6666'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Tutor profiles
UPDATE public.profiles SET
  phone = '080-1111-1111'
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE public.profiles SET
  phone = '080-2222-2222'
WHERE id = '66666666-6666-6666-6666-666666666666';

-- Student profiles with student-specific fields
UPDATE public.profiles SET
  student_number = 'S2024001',
  grade = 2,
  phone = '080-1234-0001',
  parent_name = '高橋一郎',
  parent_phone = '090-9876-0001'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.profiles SET
  student_number = 'S2024002',
  grade = 1,
  phone = '080-1234-0002',
  parent_name = '渡辺次郎',
  parent_phone = '090-9876-0002'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE public.profiles SET
  student_number = 'S2024003',
  grade = 3,
  phone = '080-1234-0003',
  parent_name = '中村三郎',
  parent_phone = '090-9876-0003'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

UPDATE public.profiles SET
  student_number = 'S2024004',
  grade = 1,
  phone = '080-1234-0004',
  parent_name = '小林四郎',
  parent_phone = '090-9876-0004'
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

UPDATE public.profiles SET
  student_number = 'S2024005',
  grade = 2,
  phone = '080-1234-0005',
  parent_name = '加藤五郎',
  parent_phone = '090-9876-0005'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ============================================================
-- 3. COURSE CATEGORIES
--    (already seeded by schema, but ensure they exist)
-- ============================================================
INSERT INTO public.course_categories (name, slug, display_order, description) VALUES
  ('一般', 'general', 1, '一般受験対策講座'),
  ('推薦', 'recommendation', 2, '推薦入試対策講座'),
  ('留型クラス', 'ryugata', 3, '留学型クラス向け講座'),
  ('中学', 'junior', 4, '中学生向け講座')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 4. COURSES (41 courses)
--    We reference category_id via subquery for portability
--
--    Time periods (Mon-Fri):
--      1限: 15:30-16:50
--      2限: 17:00-18:20
--      3限: 18:30-19:50
--    Time periods (Saturday):
--      1限: 13:10-14:30
--      2限: 14:40-16:00
--      3限: 16:10-17:30
--      4限: 17:40-19:00
-- ============================================================

-- =============================================
-- 一般 (general) category: 高1 courses (5)
-- Display: 高1 sees general only
-- =============================================

-- C1: 高1英語（集団）- Mon 1限 ★ 4-course slot test
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高1英語（集団）',
  '英語',
  '高校1年生向けの英語集団授業です。基礎文法から長文読解まで幅広く扱います。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '月',
  '15:30',
  '16:50',
  '教室A',
  25,
  15000,
  '高1',
  '通年',
  'open',
  1
)
ON CONFLICT (id) DO NOTHING;

-- C2: 高1数学（集団）- Tue 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c2222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高1数学（集団）',
  '数学',
  '高校1年生向けの数学集団授業です。数学I・Aの基礎を固めます。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '火',
  '15:30',
  '16:50',
  '教室B',
  25,
  15000,
  '高1',
  '通年',
  'open',
  2
)
ON CONFLICT (id) DO NOTHING;

-- C3: 高1国語（集団）- Wed 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高1国語（集団）',
  '国語',
  '高校1年生向けの国語集団授業です。現代文・古文・漢文の基礎を学びます。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '水',
  '17:00',
  '18:20',
  '教室C',
  25,
  15000,
  '高1',
  '通年',
  'open',
  3
)
ON CONFLICT (id) DO NOTHING;

-- C4: 高1理科（集団）- Thu 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c4444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高1理科（集団）',
  '理科',
  '高校1年生向けの理科集団授業です。物理基礎・化学基礎の基本を学びます。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '木',
  '15:30',
  '16:50',
  '教室B',
  25,
  15000,
  '高1',
  '通年',
  'open',
  4
)
ON CONFLICT (id) DO NOTHING;

-- C5: 高1社会（集団）- Fri 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c5555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高1社会（集団）',
  '社会',
  '高校1年生向けの社会集団授業です。歴史総合・公共の基礎を固めます。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '金',
  '15:30',
  '16:50',
  '教室C',
  25,
  15000,
  '高1',
  '通年',
  'open',
  5
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 一般 (general) category: 高2 courses (5)
-- Display: 高2 sees general + ryugata
-- =============================================

-- C6: 高2英語（集団）- Mon 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c6666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高2英語（集団）',
  '英語',
  '高校2年生向けの英語集団授業です。入試を見据えた実践的な英語力を養成します。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '月',
  '17:00',
  '18:20',
  '教室A',
  25,
  15000,
  '高2',
  '通年',
  'open',
  6
)
ON CONFLICT (id) DO NOTHING;

-- C7: 高2数学（集団）- Tue 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c7777777-7777-7777-7777-777777777777',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高2数学（集団）',
  '数学',
  '高校2年生向けの数学集団授業です。数学II・Bの応用力を鍛えます。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '火',
  '17:00',
  '18:20',
  '教室B',
  25,
  15000,
  '高2',
  '通年',
  'open',
  7
)
ON CONFLICT (id) DO NOTHING;

-- C8: 高2国語（集団）- Wed 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c8888888-8888-8888-8888-888888888888',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高2国語（集団）',
  '国語',
  '高校2年生向けの国語集団授業です。現代文読解と古典文法の応用を扱います。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '水',
  '15:30',
  '16:50',
  '教室C',
  25,
  15000,
  '高2',
  '通年',
  'open',
  8
)
ON CONFLICT (id) DO NOTHING;

-- C9: 高2理科（集団）- Thu 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'c9999999-9999-9999-9999-999999999999',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高2理科（集団）',
  '理科',
  '高校2年生向けの理科集団授業です。物理・化学の発展内容を学びます。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '木',
  '17:00',
  '18:20',
  '教室B',
  25,
  15000,
  '高2',
  '通年',
  'open',
  9
)
ON CONFLICT (id) DO NOTHING;

-- C10: 高2社会（集団）- Fri 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'ca111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高2社会（集団）',
  '社会',
  '高校2年生向けの社会集団授業です。日本史・世界史の重要テーマを深掘りします。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '金',
  '17:00',
  '18:20',
  '教室C',
  25,
  15000,
  '高2',
  '通年',
  'open',
  10
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 一般 (general) category: 高3 courses (5)
-- Display: 高3 sees general + recommendation
-- =============================================

-- C11: 高3英語（集団）- Mon 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'cb222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高3英語（集団）',
  '英語',
  '高校3年生向けの英語集団授業です。大学入試に向けた総合的な英語力を完成させます。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '月',
  '18:30',
  '19:50',
  '教室A',
  30,
  18000,
  '高3',
  '通年',
  'open',
  11
)
ON CONFLICT (id) DO NOTHING;

-- C12: 高3数学（集団）- Tue 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'cc333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高3数学（集団）',
  '数学',
  '高校3年生向けの数学集団授業です。入試レベルの問題演習を中心に行います。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '火',
  '18:30',
  '19:50',
  '教室B',
  30,
  18000,
  '高3',
  '通年',
  'open',
  12
)
ON CONFLICT (id) DO NOTHING;

-- C13: 高3国語（集団）- Wed 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'cd444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高3国語（集団）',
  '国語',
  '高校3年生向けの国語集団授業です。入試現代文・古典の実戦演習を行います。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '水',
  '18:30',
  '19:50',
  '教室C',
  30,
  18000,
  '高3',
  '通年',
  'open',
  13
)
ON CONFLICT (id) DO NOTHING;

-- C14: 高3理科（集団）- Thu 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'ce555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高3理科（集団）',
  '理科',
  '高校3年生向けの理科集団授業です。物理・化学の入試頻出分野を集中演習します。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '木',
  '18:30',
  '19:50',
  '教室B',
  30,
  18000,
  '高3',
  '通年',
  'open',
  14
)
ON CONFLICT (id) DO NOTHING;

-- C15: 高3社会（集団）- Fri 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'cf666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高3社会（集団）',
  '社会',
  '高校3年生向けの社会集団授業です。日本史・世界史・政経の入試対策を行います。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '金',
  '18:30',
  '19:50',
  '教室C',
  30,
  18000,
  '高3',
  '通年',
  'open',
  15
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 推薦 (recommendation) category: 高3 courses (3)
-- Display: 高3 sees general + recommendation
-- =============================================

-- C16: 推薦英語対策 - Sat 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd1111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.course_categories WHERE slug = 'recommendation'),
  '推薦英語対策',
  '英語',
  '推薦入試に特化した英語対策講座です。面接・小論文の英語表現も含みます。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '土',
  '13:10',
  '14:30',
  '教室A',
  15,
  20000,
  '高3',
  '通年',
  'open',
  1
)
ON CONFLICT (id) DO NOTHING;

-- C17: 推薦小論文 - Sat 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd2222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.course_categories WHERE slug = 'recommendation'),
  '推薦小論文',
  '小論文',
  '推薦入試で必要な小論文対策講座です。論理的な文章構成と表現力を磨きます。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '土',
  '14:40',
  '16:00',
  '教室C',
  15,
  20000,
  '高3',
  '通年',
  'open',
  2
)
ON CONFLICT (id) DO NOTHING;

-- C18: 推薦面接対策 - Sat 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd3333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.course_categories WHERE slug = 'recommendation'),
  '推薦面接対策',
  '面接',
  '推薦入試の面接対策講座です。志望理由の整理から模擬面接まで実践的に指導します。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '土',
  '16:10',
  '17:30',
  '教室C',
  15,
  20000,
  '高3',
  '通年',
  'open',
  3
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 留型クラス (ryugata) category: 高2 courses (3)
-- Display: 高2 sees general + ryugata
-- =============================================

-- C19: 留型英語 - Wed 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd4444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.course_categories WHERE slug = 'ryugata'),
  '留型英語',
  '英語',
  '留学型クラスの生徒向け英語講座です。実践的なコミュニケーション能力を高めます。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '水',
  '18:30',
  '19:50',
  '教室A',
  20,
  15000,
  '高2',
  '通年',
  'open',
  1
)
ON CONFLICT (id) DO NOTHING;

-- C20: 留型数学 - Thu 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd5555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.course_categories WHERE slug = 'ryugata'),
  '留型数学',
  '数学',
  '留学型クラスの生徒向け数学講座です。海外大学進学も視野に入れた数学力を養います。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '木',
  '18:30',
  '19:50',
  '教室D',
  20,
  15000,
  '高2',
  '通年',
  'open',
  2
)
ON CONFLICT (id) DO NOTHING;

-- C21: 留型国際教養 - Sat 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd6666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.course_categories WHERE slug = 'ryugata'),
  '留型国際教養',
  '国語',
  '留学型クラス向けの国際教養講座です。日本文化と国際社会について学びます。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '土',
  '13:10',
  '14:30',
  '教室D',
  20,
  15000,
  '高2',
  '通年',
  'open',
  3
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 中学 (junior) category: 中1 courses (3)
-- =============================================

-- C22: 中1英語 - Mon 1限 ★ 4-course slot test
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd7777777-7777-7777-7777-777777777777',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中1英語',
  '英語',
  '中学1年生向けの英語講座です。アルファベットから基礎文法まで丁寧に指導します。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '月',
  '15:30',
  '16:50',
  '教室D',
  20,
  12000,
  '中1',
  '通年',
  'open',
  1
)
ON CONFLICT (id) DO NOTHING;

-- C23: 中1数学 - Tue 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd8888888-8888-8888-8888-888888888888',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中1数学',
  '数学',
  '中学1年生向けの数学講座です。正負の数、文字式、方程式の基礎を学びます。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '火',
  '17:00',
  '18:20',
  '教室D',
  20,
  12000,
  '中1',
  '通年',
  'open',
  2
)
ON CONFLICT (id) DO NOTHING;

-- C24: 中1国語 - Fri 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'd9999999-9999-9999-9999-999999999999',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中1国語',
  '国語',
  '中学1年生向けの国語講座です。読解力と文法の基礎を養成します。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '金',
  '17:00',
  '18:20',
  '教室D',
  20,
  12000,
  '中1',
  '通年',
  'open',
  3
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 中学 (junior) category: 中2 courses (3)
-- =============================================

-- C25: 中2英語 - Mon 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'da111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中2英語',
  '英語',
  '中学2年生向けの英語講座です。比較・不定詞・動名詞など重要文法を扱います。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '月',
  '17:00',
  '18:20',
  '教室D',
  20,
  12000,
  '中2',
  '通年',
  'open',
  4
)
ON CONFLICT (id) DO NOTHING;

-- C26: 中2数学 - Wed 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'db222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中2数学',
  '数学',
  '中学2年生向けの数学講座です。連立方程式・一次関数・図形の証明を学びます。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '水',
  '15:30',
  '16:50',
  '教室D',
  20,
  12000,
  '中2',
  '通年',
  'open',
  5
)
ON CONFLICT (id) DO NOTHING;

-- C27: 中2国語 - Thu 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'dc333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中2国語',
  '国語',
  '中学2年生向けの国語講座です。長文読解と文法の応用力を鍛えます。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '木',
  '17:00',
  '18:20',
  '教室D',
  20,
  12000,
  '中2',
  '通年',
  'open',
  6
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 中学 (junior) category: 中3 courses (3)
-- =============================================

-- C28: 中3英語 - Mon 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'dd444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中3英語',
  '英語',
  '中学3年生向けの英語講座です。高校入試を見据えた総合的な英語力を養成します。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '月',
  '18:30',
  '19:50',
  '教室D',
  20,
  12000,
  '中3',
  '通年',
  'open',
  7
)
ON CONFLICT (id) DO NOTHING;

-- C29: 中3数学 - Tue 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'de555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中3数学',
  '数学',
  '中学3年生向けの数学講座です。二次方程式・関数・相似など入試頻出分野を演習します。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '火',
  '18:30',
  '19:50',
  '教室D',
  20,
  12000,
  '中3',
  '通年',
  'open',
  8
)
ON CONFLICT (id) DO NOTHING;

-- C30: 中3国語 - Wed 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'df666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中3国語',
  '国語',
  '中学3年生向けの国語講座です。入試レベルの読解力と記述力を養成します。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '水',
  '18:30',
  '19:50',
  '教室D',
  20,
  12000,
  '中3',
  '通年',
  'open',
  9
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 個別 (individual) courses (2)
-- Under general category
-- =============================================

-- C31: 個別英語（1:1）- Mon 1限 ★ 4-course slot test
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e1111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '個別英語（1:1）',
  '英語',
  '講師1名と生徒1名のマンツーマン英語指導です。個別のニーズに合わせたカリキュラムで進めます。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'individual_1on1',
  '月',
  '15:30',
  '16:50',
  '個別室1',
  1,
  25000,
  '高1',
  '通年',
  'open',
  30
)
ON CONFLICT (id) DO NOTHING;

-- C32: 個別数学（1:2）- Thu 1限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e2222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '個別数学（1:2）',
  '数学',
  '講師1名と生徒2名の少人数数学指導です。きめ細かい指導で苦手分野を克服します。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'individual_1on2',
  '木',
  '15:30',
  '16:50',
  '個別室2',
  2,
  20000,
  '高2',
  '通年',
  'open',
  31
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Saturday additional courses for filling slots
-- =============================================

-- C33: 高1英語演習（土曜）- Sat 1限 ★ 4-course slot test on Sat 1限 with C16, C21
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e3333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高1英語演習（土曜）',
  '英語',
  '土曜日の高1英語演習クラスです。平日授業の復習と応用問題に取り組みます。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '土',
  '13:10',
  '14:30',
  '教室B',
  25,
  15000,
  '高1',
  '通年',
  'open',
  16
)
ON CONFLICT (id) DO NOTHING;

-- C34: 中3理科（土曜）- Sat 1限 ★ 4th course for Sat 1限 slot test
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e4444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中3理科（土曜）',
  '理科',
  '中学3年生向けの土曜理科講座です。入試に向けた理科の総復習を行います。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '土',
  '13:10',
  '14:30',
  '教室E',
  20,
  12000,
  '中3',
  '通年',
  'open',
  17
)
ON CONFLICT (id) DO NOTHING;

-- C35: 高2英語演習（土曜）- Sat 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e5555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高2英語演習（土曜）',
  '英語',
  '土曜日の高2英語演習クラスです。長文読解とリスニングの強化を図ります。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '土',
  '14:40',
  '16:00',
  '教室A',
  25,
  15000,
  '高2',
  '通年',
  'open',
  18
)
ON CONFLICT (id) DO NOTHING;

-- C36: 中2英語（土曜）- Sat 2限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e6666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中2英語（土曜）',
  '英語',
  '中学2年生向けの土曜英語講座です。平日授業の補強と英検対策を行います。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '土',
  '14:40',
  '16:00',
  '教室D',
  20,
  12000,
  '中2',
  '通年',
  'open',
  19
)
ON CONFLICT (id) DO NOTHING;

-- C37: 高3数学演習（土曜）- Sat 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e7777777-7777-7777-7777-777777777777',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高3数学演習（土曜）',
  '数学',
  '土曜日の高3数学演習クラスです。難関大入試対策の問題演習を集中的に行います。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '土',
  '16:10',
  '17:30',
  '教室B',
  30,
  18000,
  '高3',
  '通年',
  'open',
  20
)
ON CONFLICT (id) DO NOTHING;

-- C38: 中1数学（土曜）- Sat 3限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e8888888-8888-8888-8888-888888888888',
  (SELECT id FROM public.course_categories WHERE slug = 'junior'),
  '中1数学（土曜）',
  '数学',
  '中学1年生向けの土曜数学講座です。計算力強化と文章題演習を行います。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '土',
  '16:10',
  '17:30',
  '教室D',
  20,
  12000,
  '中1',
  '通年',
  'open',
  21
)
ON CONFLICT (id) DO NOTHING;

-- C39: 高1数学演習（土曜）- Sat 4限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'e9999999-9999-9999-9999-999999999999',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高1数学演習（土曜）',
  '数学',
  '土曜日の高1数学演習クラスです。定期テスト対策と応用問題演習を行います。',
  '鈴木先生',
  '33333333-3333-3333-3333-333333333333',
  'group',
  '土',
  '17:40',
  '19:00',
  '教室B',
  25,
  15000,
  '高1',
  '通年',
  'open',
  22
)
ON CONFLICT (id) DO NOTHING;

-- C40: 高3英語演習（土曜）- Sat 4限
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'ea111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高3英語演習（土曜）',
  '英語',
  '土曜日の高3英語演習クラスです。入試長文読解の実戦演習を行います。',
  '山田先生',
  '22222222-2222-2222-2222-222222222222',
  'group',
  '土',
  '17:40',
  '19:00',
  '教室A',
  30,
  18000,
  '高3',
  '通年',
  'open',
  23
)
ON CONFLICT (id) DO NOTHING;

-- C41: 高2国語（集団）【準備中】 - draft course for testing filters
INSERT INTO public.courses (id, category_id, name, subject, description, instructor_name, instructor_id, course_type, day_of_week, start_time, end_time, classroom, capacity, price, target_grade, term, status, display_order)
VALUES (
  'eb222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.course_categories WHERE slug = 'general'),
  '高2国語演習（集団）【準備中】',
  '国語',
  '高校2年生向けの国語演習授業です。現在準備中のため受付停止中です。',
  '田中先生',
  '44444444-4444-4444-4444-444444444444',
  'group',
  '水',
  '17:00',
  '18:20',
  '教室E',
  25,
  15000,
  '高2',
  '通年',
  'draft',
  99
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. TIMETABLE_SLOTS
--    Weekday periods: 1=15:30-16:50, 2=17:00-18:20, 3=18:30-19:50
--    Saturday periods: 1=13:10-14:30, 2=14:40-16:00, 3=16:10-17:30, 4=17:40-19:00
-- ============================================================

INSERT INTO public.timetable_slots (course_id, day_of_week, period, start_time, end_time, classroom, term) VALUES
  -- ===== 月曜 (Monday) =====
  -- 1限 15:30-16:50 ★ 4 courses in this slot (test max density)
  ('c1111111-1111-1111-1111-111111111111', '月', 1, '15:30', '16:50', '教室A', '通年'),     -- 高1英語
  ('d7777777-7777-7777-7777-777777777777', '月', 1, '15:30', '16:50', '教室D', '通年'),     -- 中1英語
  ('e1111111-1111-1111-1111-111111111111', '月', 1, '15:30', '16:50', '個別室1', '通年'),   -- 個別英語
  -- (3 courses in Mon 1限 - add 4th below for Mon 1限 if needed, but let's use Sat for 4-slot test)
  -- 2限 17:00-18:20
  ('c6666666-6666-6666-6666-666666666666', '月', 2, '17:00', '18:20', '教室A', '通年'),     -- 高2英語
  ('da111111-1111-1111-1111-111111111111', '月', 2, '17:00', '18:20', '教室D', '通年'),     -- 中2英語
  -- 3限 18:30-19:50
  ('cb222222-2222-2222-2222-222222222222', '月', 3, '18:30', '19:50', '教室A', '通年'),     -- 高3英語
  ('dd444444-4444-4444-4444-444444444444', '月', 3, '18:30', '19:50', '教室D', '通年'),     -- 中3英語

  -- ===== 火曜 (Tuesday) =====
  -- 1限 15:30-16:50
  ('c2222222-2222-2222-2222-222222222222', '火', 1, '15:30', '16:50', '教室B', '通年'),     -- 高1数学
  -- 2限 17:00-18:20
  ('c7777777-7777-7777-7777-777777777777', '火', 2, '17:00', '18:20', '教室B', '通年'),     -- 高2数学
  ('d8888888-8888-8888-8888-888888888888', '火', 2, '17:00', '18:20', '教室D', '通年'),     -- 中1数学
  -- 3限 18:30-19:50
  ('cc333333-3333-3333-3333-333333333333', '火', 3, '18:30', '19:50', '教室B', '通年'),     -- 高3数学
  ('de555555-5555-5555-5555-555555555555', '火', 3, '18:30', '19:50', '教室D', '通年'),     -- 中3数学

  -- ===== 水曜 (Wednesday) =====
  -- 1限 15:30-16:50
  ('c8888888-8888-8888-8888-888888888888', '水', 1, '15:30', '16:50', '教室C', '通年'),     -- 高2国語
  ('db222222-2222-2222-2222-222222222222', '水', 1, '15:30', '16:50', '教室D', '通年'),     -- 中2数学
  -- 2限 17:00-18:20
  ('c3333333-3333-3333-3333-333333333333', '水', 2, '17:00', '18:20', '教室C', '通年'),     -- 高1国語
  -- 3限 18:30-19:50
  ('cd444444-4444-4444-4444-444444444444', '水', 3, '18:30', '19:50', '教室C', '通年'),     -- 高3国語
  ('d4444444-4444-4444-4444-444444444444', '水', 3, '18:30', '19:50', '教室A', '通年'),     -- 留型英語
  ('df666666-6666-6666-6666-666666666666', '水', 3, '18:30', '19:50', '教室D', '通年'),     -- 中3国語

  -- ===== 木曜 (Thursday) =====
  -- 1限 15:30-16:50
  ('c4444444-4444-4444-4444-444444444444', '木', 1, '15:30', '16:50', '教室B', '通年'),     -- 高1理科
  ('e2222222-2222-2222-2222-222222222222', '木', 1, '15:30', '16:50', '個別室2', '通年'),   -- 個別数学
  -- 2限 17:00-18:20
  ('c9999999-9999-9999-9999-999999999999', '木', 2, '17:00', '18:20', '教室B', '通年'),     -- 高2理科
  ('dc333333-3333-3333-3333-333333333333', '木', 2, '17:00', '18:20', '教室D', '通年'),     -- 中2国語
  -- 3限 18:30-19:50
  ('ce555555-5555-5555-5555-555555555555', '木', 3, '18:30', '19:50', '教室B', '通年'),     -- 高3理科
  ('d5555555-5555-5555-5555-555555555555', '木', 3, '18:30', '19:50', '教室D', '通年'),     -- 留型数学

  -- ===== 金曜 (Friday) =====
  -- 1限 15:30-16:50
  ('c5555555-5555-5555-5555-555555555555', '金', 1, '15:30', '16:50', '教室C', '通年'),     -- 高1社会
  -- 2限 17:00-18:20
  ('ca111111-1111-1111-1111-111111111111', '金', 2, '17:00', '18:20', '教室C', '通年'),     -- 高2社会
  ('d9999999-9999-9999-9999-999999999999', '金', 2, '17:00', '18:20', '教室D', '通年'),     -- 中1国語
  -- 3限 18:30-19:50
  ('cf666666-6666-6666-6666-666666666666', '金', 3, '18:30', '19:50', '教室C', '通年'),     -- 高3社会

  -- ===== 土曜 (Saturday) =====
  -- 1限 13:10-14:30 ★ 4 courses in this slot (test max density)
  ('d1111111-1111-1111-1111-111111111111', '土', 1, '13:10', '14:30', '教室A', '通年'),     -- 推薦英語対策
  ('d6666666-6666-6666-6666-666666666666', '土', 1, '13:10', '14:30', '教室D', '通年'),     -- 留型国際教養
  ('e3333333-3333-3333-3333-333333333333', '土', 1, '13:10', '14:30', '教室B', '通年'),     -- 高1英語演習
  ('e4444444-4444-4444-4444-444444444444', '土', 1, '13:10', '14:30', '教室E', '通年'),     -- 中3理科（土曜）
  -- 2限 14:40-16:00
  ('d2222222-2222-2222-2222-222222222222', '土', 2, '14:40', '16:00', '教室C', '通年'),     -- 推薦小論文
  ('e5555555-5555-5555-5555-555555555555', '土', 2, '14:40', '16:00', '教室A', '通年'),     -- 高2英語演習
  ('e6666666-6666-6666-6666-666666666666', '土', 2, '14:40', '16:00', '教室D', '通年'),     -- 中2英語（土曜）
  -- 3限 16:10-17:30
  ('d3333333-3333-3333-3333-333333333333', '土', 3, '16:10', '17:30', '教室C', '通年'),     -- 推薦面接対策
  ('e7777777-7777-7777-7777-777777777777', '土', 3, '16:10', '17:30', '教室B', '通年'),     -- 高3数学演習
  ('e8888888-8888-8888-8888-888888888888', '土', 3, '16:10', '17:30', '教室D', '通年'),     -- 中1数学（土曜）
  -- 4限 17:40-19:00
  ('e9999999-9999-9999-9999-999999999999', '土', 4, '17:40', '19:00', '教室B', '通年'),     -- 高1数学演習
  ('ea111111-1111-1111-1111-111111111111', '土', 4, '17:40', '19:00', '教室A', '通年')      -- 高3英語演習
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. ENROLLMENTS (20 enrollments)
--    Diverse statuses, payment states, and methods
-- ============================================================

INSERT INTO public.enrollments (student_id, course_id, status, payment_method, payment_status, payment_amount, payment_due_date, enrolled_at, confirmed_at) VALUES

  -- 高橋花子 (grade 2) -- enrolled in 4 courses
  -- 高2英語: confirmed + paid
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c6666666-6666-6666-6666-666666666666',
   'confirmed', 'bank_transfer', 'paid', 15000, '2024-04-30',
   '2024-04-01 10:00:00+09', '2024-04-02 14:00:00+09'),

  -- 高2数学: confirmed + paid
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c7777777-7777-7777-7777-777777777777',
   'confirmed', 'bank_transfer', 'paid', 15000, '2024-04-30',
   '2024-04-01 10:05:00+09', '2024-04-02 14:05:00+09'),

  -- 留型英語: confirmed + paid
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd4444444-4444-4444-4444-444444444444',
   'confirmed', 'bank_transfer', 'paid', 15000, '2024-04-30',
   '2024-04-01 10:10:00+09', '2024-04-03 09:00:00+09'),

  -- 個別数学: confirmed + partial payment (installment)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e2222222-2222-2222-2222-222222222222',
   'confirmed', 'installment_2', 'partial', 10000, '2024-05-31',
   '2024-04-05 09:00:00+09', '2024-04-06 10:00:00+09'),

  -- 渡辺太郎 (grade 1) -- enrolled in 3 courses
  -- 高1英語: confirmed + paid
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1111111-1111-1111-1111-111111111111',
   'confirmed', 'bank_transfer', 'paid', 15000, '2024-04-30',
   '2024-04-02 11:00:00+09', '2024-04-03 15:00:00+09'),

  -- 高1数学: confirmed + unpaid
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c2222222-2222-2222-2222-222222222222',
   'confirmed', 'bank_transfer', 'unpaid', 0, '2024-05-31',
   '2024-04-02 11:05:00+09', '2024-04-03 15:05:00+09'),

  -- 高1国語: pending
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c3333333-3333-3333-3333-333333333333',
   'pending', NULL, 'unpaid', 0, NULL,
   '2024-04-10 08:30:00+09', NULL),

  -- 中村さくら (grade 3) -- enrolled in 4 courses
  -- 高3英語: confirmed + paid
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cb222222-2222-2222-2222-222222222222',
   'confirmed', 'bank_transfer', 'paid', 18000, '2024-04-30',
   '2024-03-25 09:00:00+09', '2024-03-26 10:00:00+09'),

  -- 高3数学: confirmed + paid
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cc333333-3333-3333-3333-333333333333',
   'confirmed', 'bank_transfer', 'paid', 18000, '2024-04-30',
   '2024-03-25 09:05:00+09', '2024-03-26 10:05:00+09'),

  -- 推薦英語: confirmed + installment paid
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'd1111111-1111-1111-1111-111111111111',
   'confirmed', 'installment_1', 'paid', 20000, '2024-04-30',
   '2024-03-25 09:10:00+09', '2024-03-27 11:00:00+09'),

  -- 推薦小論文: confirmed + unpaid
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'd2222222-2222-2222-2222-222222222222',
   'confirmed', 'installment_1', 'unpaid', 0, '2024-05-31',
   '2024-03-25 09:15:00+09', '2024-03-27 11:05:00+09'),

  -- 小林優斗 (grade 1) -- enrolled in 3 courses
  -- 高1英語: confirmed + paid
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'c1111111-1111-1111-1111-111111111111',
   'confirmed', 'bank_transfer', 'paid', 15000, '2024-04-30',
   '2024-04-03 13:00:00+09', '2024-04-04 09:00:00+09'),

  -- 高1数学: confirmed + paid
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'c2222222-2222-2222-2222-222222222222',
   'confirmed', 'installment_2', 'paid', 15000, '2024-04-30',
   '2024-04-03 13:05:00+09', '2024-04-04 09:05:00+09'),

  -- 高1社会: confirmed + unpaid
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'c5555555-5555-5555-5555-555555555555',
   'confirmed', 'bank_transfer', 'unpaid', 0, '2024-05-31',
   '2024-04-03 13:10:00+09', '2024-04-04 09:10:00+09'),

  -- 個別英語: pending
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'e1111111-1111-1111-1111-111111111111',
   'pending', NULL, 'unpaid', 0, NULL,
   '2024-04-15 16:00:00+09', NULL),

  -- 加藤美咲 (grade 2) -- enrolled in 4 courses
  -- 高2英語: confirmed + paid
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'c6666666-6666-6666-6666-666666666666',
   'confirmed', 'bank_transfer', 'paid', 15000, '2024-04-30',
   '2024-04-01 14:00:00+09', '2024-04-02 16:00:00+09'),

  -- 高2数学: confirmed + paid
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'c7777777-7777-7777-7777-777777777777',
   'confirmed', 'installment_1', 'paid', 15000, '2024-04-30',
   '2024-04-01 14:05:00+09', '2024-04-02 16:05:00+09'),

  -- 留型英語: confirmed + partial
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'd4444444-4444-4444-4444-444444444444',
   'confirmed', 'installment_2', 'partial', 7500, '2024-05-15',
   '2024-04-01 14:10:00+09', '2024-04-03 10:00:00+09'),

  -- 高2英語 cancelled enrollment (for testing cancelled state)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c6666666-6666-6666-6666-666666666666',
   'cancelled', NULL, 'refunded', 15000, NULL,
   '2024-04-05 10:00:00+09', NULL),

  -- 個別英語: completed enrollment (for testing completed state)
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'e1111111-1111-1111-1111-111111111111',
   'completed', 'bank_transfer', 'paid', 25000, '2024-04-30',
   '2024-01-10 09:00:00+09', '2024-01-11 10:00:00+09')

ON CONFLICT (student_id, course_id) DO NOTHING;

-- ============================================================
-- 7. CLASSROOM_ASSIGNMENTS (15 assignments)
-- ============================================================

INSERT INTO public.classroom_assignments (course_id, classroom, day_of_week, start_time, end_time, effective_date, notes) VALUES
  ('c1111111-1111-1111-1111-111111111111', '教室A', '月', '15:30', '16:50', '2024-04-01', '通年固定教室'),
  ('c6666666-6666-6666-6666-666666666666', '教室A', '月', '17:00', '18:20', '2024-04-01', '通年固定教室'),
  ('cb222222-2222-2222-2222-222222222222', '教室A', '月', '18:30', '19:50', '2024-04-01', '通年固定教室'),
  ('c2222222-2222-2222-2222-222222222222', '教室B', '火', '15:30', '16:50', '2024-04-01', '通年固定教室'),
  ('c7777777-7777-7777-7777-777777777777', '教室B', '火', '17:00', '18:20', '2024-04-01', '通年固定教室'),
  ('cc333333-3333-3333-3333-333333333333', '教室B', '火', '18:30', '19:50', '2024-04-01', '通年固定教室'),
  ('c8888888-8888-8888-8888-888888888888', '教室C', '水', '15:30', '16:50', '2024-04-01', '通年固定教室'),
  ('c3333333-3333-3333-3333-333333333333', '教室C', '水', '17:00', '18:20', '2024-04-01', '通年固定教室'),
  ('cd444444-4444-4444-4444-444444444444', '教室C', '水', '18:30', '19:50', '2024-04-01', '通年固定教室'),
  ('d7777777-7777-7777-7777-777777777777', '教室D', '月', '15:30', '16:50', '2024-04-01', '中学生専用教室'),
  ('da111111-1111-1111-1111-111111111111', '教室D', '月', '17:00', '18:20', '2024-04-01', '中学生専用教室'),
  ('d1111111-1111-1111-1111-111111111111', '教室A', '土', '13:10', '14:30', '2024-04-01', '推薦対策用'),
  ('d2222222-2222-2222-2222-222222222222', '教室C', '土', '14:40', '16:00', '2024-04-01', '推薦対策用'),
  ('d3333333-3333-3333-3333-333333333333', '教室C', '土', '16:10', '17:30', '2024-04-01', '推薦対策用'),
  ('d4444444-4444-4444-4444-444444444444', '教室A', '水', '18:30', '19:50', '2024-04-01', '留型クラス用')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. INSTRUCTOR_NOTES (6 notes)
-- ============================================================

INSERT INTO public.instructor_notes (instructor_id, course_id, target_audience, title, content) VALUES

  -- 山田先生 -> 高1英語 -> 生徒向け
  ('22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'student',
   '第1回 授業の準備物について',
   '次回の授業では以下を準備してください。
- テキスト（英語I）
- ノート
- 辞書（電子辞書可）

予習として教科書P.20-25を読んでおいてください。'),

  -- 山田先生 -> 高2英語 -> チューター向け
  ('22222222-2222-2222-2222-222222222222', 'c6666666-6666-6666-6666-666666666666', 'tutor',
   'チューター向け：小テスト採点について',
   '毎週の小テスト採点をお願いします。
- 配点は各問2点（計20点）
- 16点以上は合格
- 不合格者リストを私に共有してください

採点基準は共有フォルダの「採点マニュアル.pdf」を参照。'),

  -- 鈴木先生 -> 高1数学 -> 両方
  ('33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'both',
   '中間テスト対策について',
   '来月の中間テストに向けて、以下の範囲を重点的に復習してください。
- 二次関数（第2章）
- 三角比（第3章）

チューターの方は自習室での質問対応をお願いします。特に二次関数の最大・最小が苦手な生徒が多いです。'),

  -- 鈴木先生 -> 高2数学 -> 生徒向け
  ('33333333-3333-3333-3333-333333333333', 'c7777777-7777-7777-7777-777777777777', 'student',
   '宿題提出のリマインダー',
   '数学IIの微分の宿題を次回授業までに提出してください。
遅れる場合は事前にご連絡をお願いします。

問題番号：P.85 練習問題 1-10'),

  -- 田中先生 -> 推薦小論文 -> 生徒向け
  ('44444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'student',
   '小論文の書き方：基本構成',
   '推薦入試の小論文は以下の構成で書きましょう。

1. 序論（問題提起）- 全体の10-15%
2. 本論（主張と根拠）- 全体の70-80%
3. 結論（まとめ）- 全体の10-15%

次回は実際に800字の小論文を書いてもらいます。テーマは「AIと教育の未来」です。'),

  -- 山田先生 -> 高3英語 -> チューター向け
  ('22222222-2222-2222-2222-222222222222', 'cb222222-2222-2222-2222-222222222222', 'tutor',
   'チューター向け：模試結果のフォロー',
   '先日の模試結果が返却されました。
以下の生徒は個別フォローをお願いします。

- リスニングセクションで平均以下の生徒
- 長文読解で時間切れになった生徒

自習室で声をかけて、弱点分析を一緒にしてあげてください。')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. PRINT_REQUESTS (4 requests)
-- ============================================================

INSERT INTO public.print_requests (instructor_id, course_id, title, description, file_url, file_name, copies, status, requested_by_date, completed_at, completed_by) VALUES

  -- 完了済み
  ('22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111',
   '高1英語 小テスト第3回',
   '次回授業用の小テストです。表裏印刷でお願いします。',
   'https://storage.example.com/prints/english_quiz_3.pdf',
   'english_quiz_3.pdf',
   30,
   'completed',
   '2024-04-15',
   '2024-04-14 16:00:00+09',
   '55555555-5555-5555-5555-555555555555'),

  -- 印刷中
  ('33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222',
   '高1数学 練習問題プリント',
   '二次関数の練習問題です。A4片面でお願いします。',
   'https://storage.example.com/prints/math_practice_1.pdf',
   'math_practice_1.pdf',
   25,
   'printing',
   '2024-04-18',
   NULL,
   NULL),

  -- 保留中
  ('44444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222',
   '推薦小論文 模範解答例',
   '前回の小論文課題の模範解答です。参考資料として配布します。',
   'https://storage.example.com/prints/essay_model_answer.pdf',
   'essay_model_answer.pdf',
   15,
   'pending',
   '2024-04-22',
   NULL,
   NULL),

  -- 保留中（コースなし：一般資料）
  ('22222222-2222-2222-2222-222222222222', NULL,
   '保護者面談用資料',
   '来月の保護者面談で配布する進路ガイダンス資料です。',
   'https://storage.example.com/prints/parent_meeting_guide.pdf',
   'parent_meeting_guide.pdf',
   50,
   'pending',
   '2024-04-25',
   NULL,
   NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. TUITION_INFO (7 entries)
-- ============================================================

INSERT INTO public.tuition_info (category_id, course_type, label, price, unit, notes, display_order) VALUES

  ((SELECT id FROM public.course_categories WHERE slug = 'general'),
   'group', '一般集団授業（高1・高2）', 15000, '月額',
   '教材費込み。兄弟割引あり（10%OFF）。', 1),

  ((SELECT id FROM public.course_categories WHERE slug = 'general'),
   'group', '一般集団授業（高3）', 18000, '月額',
   '教材費込み。受験直前期は追加講習あり（別途費用）。', 2),

  ((SELECT id FROM public.course_categories WHERE slug = 'recommendation'),
   'group', '推薦対策講座', 20000, '月額',
   '面接対策・小論文添削を含みます。', 3),

  ((SELECT id FROM public.course_categories WHERE slug = 'ryugata'),
   'group', '留型クラス', 15000, '月額',
   '留学型クラス専用講座。', 4),

  ((SELECT id FROM public.course_categories WHERE slug = 'junior'),
   'group', '中学生集団授業', 12000, '月額',
   '教材費込み。', 5),

  ((SELECT id FROM public.course_categories WHERE slug = 'general'),
   'individual_1on1', '個別指導（1:1）', 25000, '月額',
   '講師1名：生徒1名のマンツーマン指導。', 6),

  ((SELECT id FROM public.course_categories WHERE slug = 'general'),
   'individual_1on2', '個別指導（1:2）', 20000, '月額',
   '講師1名：生徒2名の少人数指導。', 7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. FRONT_CONTENT (hero, about, merits sections)
-- ============================================================

INSERT INTO public.front_content (section, title, content, image_url, display_order, is_active, metadata) VALUES

  -- Hero section
  ('hero', '淑徳アドバンス', '一人ひとりの目標に寄り添い、確かな学力と自信を育む学習塾です。', NULL, 1, true,
   '{"subtitle": "未来を切り拓く学びの場", "cta_text": "無料体験に申し込む", "cta_link": "/contact"}'::jsonb),

  -- About section
  ('about', '淑徳アドバンスについて', '淑徳アドバンスは、淑徳高等学校の生徒を対象とした学内塾です。学校の授業と連携しながら、生徒一人ひとりの学力向上をサポートします。経験豊富な講師陣と大学生チューターが、きめ細かい指導を行います。', NULL, 1, true,
   '{"founded_year": 2020, "students_count": "100+"}'::jsonb),

  -- Merits section - item 1
  ('merits', '少人数制の集団授業', '1クラス最大25名の少人数制で、生徒一人ひとりに目が届く授業を実現しています。質問しやすい環境で、理解度に合わせた丁寧な指導を行います。', NULL, 1, true,
   '{"icon": "users"}'::jsonb),

  -- Merits section - item 2
  ('merits', '学校との連携', '淑徳高校の定期テストや行事に合わせたスケジュールで運営しています。学校の学習内容を踏まえた効率的な指導が可能です。', NULL, 2, true,
   '{"icon": "school"}'::jsonb),

  -- Merits section - item 3
  ('merits', '大学生チューターの自習サポート', '現役大学生チューターが自習室で学習をサポート。年齢の近い先輩からのアドバイスは、勉強のモチベーション向上にもつながります。', NULL, 3, true,
   '{"icon": "graduation-cap"}'::jsonb),

  -- Merits section - item 4
  ('merits', '推薦入試対策', '推薦入試に向けた小論文指導や面接対策も充実。志望理由書の作成から面接練習まで、合格に向けた総合的なサポートを提供します。', NULL, 4, true,
   '{"icon": "trophy"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. CONTACT_SUBMISSIONS (4 submissions)
-- ============================================================

INSERT INTO public.contact_submissions (name, email, phone, category, subject, message, status, admin_notes, created_at) VALUES

  ('山本太郎', 'yamamoto@example.com', '090-1234-5678', 'general',
   '体験授業について',
   '初めまして。高校1年生の息子の入塾を検討しています。体験授業は可能でしょうか？英語と数学を希望しています。平日の夕方が希望です。',
   'replied',
   '4/10に返信済み。4/15に体験授業を実施予定。',
   '2024-04-08 10:30:00+09'),

  ('小林花子', 'kobayashi@example.com', '080-9876-5432', 'general',
   '料金について質問',
   '中学3年生の娘がおります。来年度からの入塾を考えていますが、月謝の詳細と兄弟割引について教えていただけますか？',
   'read',
   NULL,
   '2024-04-12 14:15:00+09'),

  ('田中一郎', 'tanaka.parent@example.com', NULL, 'general',
   '授業時間の変更希望',
   '現在高2数学を受講中ですが、部活動の関係で木曜18時からの授業に出席が難しくなりました。他の曜日への振替は可能でしょうか？',
   'unread',
   NULL,
   '2024-04-15 20:00:00+09'),

  ('佐藤めぐみ', 'sato.inquiry@example.com', '070-1111-2222', 'general',
   '推薦対策講座について',
   '高3の娘が推薦入試を考えています。推薦英語対策と小論文講座の詳細（開始時期・カリキュラム内容）を教えてください。また、途中入塾は可能でしょうか？',
   'unread',
   NULL,
   '2024-04-16 09:45:00+09')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. ANNOUNCEMENTS (4 announcements)
-- ============================================================

INSERT INTO public.announcements (title, content, target_audience, is_published, published_at, created_by) VALUES

  ('2024年度 夏期講習のお知らせ',
   '2024年度の夏期講習を以下の日程で実施します。

【期間】7月22日（月）〜 8月23日（金）
【対象】全学年

各講座の詳細・申込方法は別途ご案内いたします。早期申込割引（6月末まで）もございますので、お早めにお申し込みください。',
   'all', true, '2024-04-10 09:00:00+09',
   '11111111-1111-1111-1111-111111111111'),

  ('教室利用ルールの変更について',
   '自習室の利用ルールを一部変更いたします。

【変更点】
- 利用可能時間：平日 15:00〜21:00 → 14:00〜21:30 に拡大
- 土曜日も利用可能に（10:00〜18:00）
- 飲食は指定エリアのみ

4月15日（月）より適用いたします。',
   'student', true, '2024-04-12 10:00:00+09',
   '11111111-1111-1111-1111-111111111111'),

  ('新任講師のご紹介',
   '4月より新しく田中先生が国語担当として着任いたしました。

田中先生は大手予備校で10年以上の指導経験があり、特に現代文・小論文の指導に定評があります。推薦対策講座も担当いたしますので、よろしくお願いいたします。',
   'all', true, '2024-04-05 08:00:00+09',
   '11111111-1111-1111-1111-111111111111'),

  ('年末年始の休業日について',
   '年末年始の休業日をお知らせいたします。

【休業期間】12月28日（土）〜 1月3日（金）

1月4日（土）より通常授業を再開いたします。冬期講習の追加日程については別途ご案内いたします。',
   'all', false, NULL,
   '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. STUDENT_USAGE_NOTES (4 notes)
-- ============================================================

INSERT INTO public.student_usage_notes (title, content, display_order, is_active) VALUES

  ('自習室の利用について',
   '自習室は以下のルールを守ってご利用ください。

- 利用時間：平日 14:00〜21:30 / 土曜 10:00〜18:00
- 私語厳禁（質問はチューターに）
- 飲食は指定エリアのみ
- 退室時は机の上を片付けてください
- 貴重品は各自で管理してください',
   1, true),

  ('欠席・遅刻の連絡方法',
   '欠席・遅刻する場合は、以下の方法でご連絡ください。

1. アプリのマイページから欠席連絡（推奨）
2. 電話（03-XXXX-XXXX）※授業開始30分前まで
3. メール（info@shukutoku-advance.jp）

無断欠席が3回続いた場合は、保護者の方にご連絡させていただきます。',
   2, true),

  ('教材の取り扱い',
   '配布された教材・プリントは大切に保管してください。

- 紛失した場合は再発行可能（実費負担の場合あり）
- 教材は他の生徒への譲渡・コピー不可
- 授業ごとにファイルに整理することをお勧めします',
   3, true),

  ('緊急時の連絡先',
   '緊急時は以下にご連絡ください。

- 淑徳アドバンス事務局：03-XXXX-XXXX（授業時間中）
- 緊急連絡用携帯：090-XXXX-XXXX（時間外）
- 建物管理室：内線100

体調不良・事故等の場合は、まずスタッフにお声がけください。',
   4, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE! Verify the seed data
-- ============================================================

-- Summary counts
do $$
declare
  v_users integer;
  v_profiles integer;
  v_categories integer;
  v_courses integer;
  v_slots integer;
  v_enrollments integer;
  v_assignments integer;
  v_notes integer;
  v_prints integer;
  v_tuition integer;
  v_front integer;
  v_contacts integer;
  v_announcements integer;
  v_usage integer;
begin
  select count(*) into v_users from auth.users where id in (
    '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc','dddddddd-dddd-dddd-dddd-dddddddddddd',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
  );
  select count(*) into v_profiles from public.profiles;
  select count(*) into v_categories from public.course_categories;
  select count(*) into v_courses from public.courses;
  select count(*) into v_slots from public.timetable_slots;
  select count(*) into v_enrollments from public.enrollments;
  select count(*) into v_assignments from public.classroom_assignments;
  select count(*) into v_notes from public.instructor_notes;
  select count(*) into v_prints from public.print_requests;
  select count(*) into v_tuition from public.tuition_info;
  select count(*) into v_front from public.front_content;
  select count(*) into v_contacts from public.contact_submissions;
  select count(*) into v_announcements from public.announcements;
  select count(*) into v_usage from public.student_usage_notes;

  raise notice '====================================';
  raise notice 'Seed Data Summary:';
  raise notice '  auth.users (seed):     %', v_users;
  raise notice '  profiles (total):      %', v_profiles;
  raise notice '  course_categories:     %', v_categories;
  raise notice '  courses:               %', v_courses;
  raise notice '  timetable_slots:       %', v_slots;
  raise notice '  enrollments:           %', v_enrollments;
  raise notice '  classroom_assignments: %', v_assignments;
  raise notice '  instructor_notes:      %', v_notes;
  raise notice '  print_requests:        %', v_prints;
  raise notice '  tuition_info:          %', v_tuition;
  raise notice '  front_content:         %', v_front;
  raise notice '  contact_submissions:   %', v_contacts;
  raise notice '  announcements:         %', v_announcements;
  raise notice '  student_usage_notes:   %', v_usage;
  raise notice '====================================';
  raise notice 'All test accounts use password: password123';
  raise notice '====================================';
end $$;
