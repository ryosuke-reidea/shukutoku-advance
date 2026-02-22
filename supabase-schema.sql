-- ============================================================
-- 淑徳アドバンス Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'student'
    check (role in ('student', 'admin', 'instructor', 'tutor')),
  display_name text not null default '',
  avatar_url text,
  student_number text,
  grade integer,
  phone text,
  parent_name text,
  parent_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. COURSE_CATEGORIES
-- ============================================================
create table if not exists public.course_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  display_order integer not null default 0,
  description text,
  created_at timestamptz not null default now()
);

insert into public.course_categories (name, slug, display_order, description) values
  ('一般', 'general', 1, '一般受験対策講座'),
  ('推薦', 'recommendation', 2, '推薦入試対策講座'),
  ('留型クラス', 'ryugata', 3, '留学型クラス向け講座'),
  ('中学', 'junior', 4, '中学生向け講座')
on conflict (slug) do nothing;

-- ============================================================
-- 3. COURSES
-- ============================================================
create table if not exists public.courses (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.course_categories(id) on delete cascade not null,
  name text not null,
  subject text not null,
  description text not null default '',
  instructor_name text,
  instructor_id uuid references public.profiles(id) on delete set null,
  course_type text not null default 'group'
    check (course_type in ('group', 'individual_1on1', 'individual_1on2', 'individual_1on3')),
  day_of_week text,
  start_time time,
  end_time time,
  classroom text,
  capacity integer not null default 30,
  price integer not null default 0,
  target_grade text,
  term text,
  status text not null default 'open'
    check (status in ('draft', 'open', 'closed')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. TIMETABLE_SLOTS
-- ============================================================
create table if not exists public.timetable_slots (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  day_of_week text not null,
  period integer not null,
  start_time time not null,
  end_time time not null,
  classroom text not null,
  term text not null default '通年',
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. ENROLLMENTS
-- ============================================================
create table if not exists public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_method text
    check (payment_method in ('bank_transfer', 'installment_1', 'installment_2')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  payment_amount integer not null default 0,
  payment_due_date date,
  enrolled_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, course_id)
);

-- ============================================================
-- 6. CLASSROOM_ASSIGNMENTS
-- ============================================================
create table if not exists public.classroom_assignments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  classroom text not null,
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  effective_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. INSTRUCTOR_NOTES
-- ============================================================
create table if not exists public.instructor_notes (
  id uuid default uuid_generate_v4() primary key,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  target_audience text not null default 'student'
    check (target_audience in ('student', 'tutor', 'both')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 8. PRINT_REQUESTS
-- ============================================================
create table if not exists public.print_requests (
  id uuid default uuid_generate_v4() primary key,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_name text not null,
  copies integer not null default 1,
  status text not null default 'pending'
    check (status in ('pending', 'printing', 'completed')),
  requested_by_date date,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. TUITION_INFO
-- ============================================================
create table if not exists public.tuition_info (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.course_categories(id) on delete cascade,
  course_type text not null,
  label text not null,
  price integer not null,
  unit text not null default '月額',
  notes text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 10. FRONT_CONTENT
-- ============================================================
create table if not exists public.front_content (
  id uuid default uuid_generate_v4() primary key,
  section text not null,
  title text,
  content text,
  image_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 11. CONTACT_SUBMISSIONS
-- ============================================================
create table if not exists public.contact_submissions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  phone text,
  category text not null default 'general',
  subject text not null,
  message text not null,
  status text not null default 'unread'
    check (status in ('unread', 'read', 'replied')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 12. ANNOUNCEMENTS
-- ============================================================
create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  target_audience text not null default 'all'
    check (target_audience in ('all', 'student', 'instructor', 'tutor')),
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 13. STUDENT_USAGE_NOTES
-- ============================================================
create table if not exists public.student_usage_notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.course_categories enable row level security;
alter table public.courses enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.enrollments enable row level security;
alter table public.classroom_assignments enable row level security;
alter table public.instructor_notes enable row level security;
alter table public.print_requests enable row level security;
alter table public.tuition_info enable row level security;
alter table public.front_content enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.announcements enable row level security;
alter table public.student_usage_notes enable row level security;

-- Helper function
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Profiles
create policy "Public profiles viewable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admins can do all on profiles" on public.profiles for all using (public.get_user_role() = 'admin');

-- Course Categories
create policy "Categories viewable by all" on public.course_categories for select using (true);
create policy "Admins manage categories" on public.course_categories for all using (public.get_user_role() = 'admin');

-- Courses
create policy "Open courses viewable" on public.courses for select using (true);
create policy "Admins manage courses" on public.courses for all using (public.get_user_role() = 'admin');
create policy "Instructors update own courses" on public.courses for update using (auth.uid() = instructor_id);

-- Timetable Slots
create policy "Timetable viewable" on public.timetable_slots for select using (true);
create policy "Admins manage timetable" on public.timetable_slots for all using (public.get_user_role() = 'admin');

-- Enrollments
create policy "Students view own enrollments" on public.enrollments for select using (auth.uid() = student_id);
create policy "Students insert own enrollments" on public.enrollments for insert with check (auth.uid() = student_id);
create policy "Admins view all enrollments" on public.enrollments for select using (public.get_user_role() = 'admin');
create policy "Admins manage enrollments" on public.enrollments for all using (public.get_user_role() = 'admin');
create policy "Instructors view course enrollments" on public.enrollments for select using (
  exists (select 1 from public.courses where courses.id = enrollments.course_id and courses.instructor_id = auth.uid())
);

-- Classroom Assignments
create policy "Classroom assignments viewable" on public.classroom_assignments for select using (true);
create policy "Admins manage classroom assignments" on public.classroom_assignments for all using (public.get_user_role() = 'admin');

-- Instructor Notes
create policy "Students view student notes" on public.instructor_notes for select using (target_audience in ('student', 'both') and public.get_user_role() = 'student');
create policy "Tutors view tutor notes" on public.instructor_notes for select using (target_audience in ('tutor', 'both') and public.get_user_role() = 'tutor');
create policy "Instructors manage own notes" on public.instructor_notes for all using (auth.uid() = instructor_id);
create policy "Admins manage all notes" on public.instructor_notes for all using (public.get_user_role() = 'admin');

-- Print Requests
create policy "Instructors manage own prints" on public.print_requests for all using (auth.uid() = instructor_id);
create policy "Tutors view prints" on public.print_requests for select using (public.get_user_role() = 'tutor');
create policy "Tutors update print status" on public.print_requests for update using (public.get_user_role() = 'tutor');
create policy "Admins manage prints" on public.print_requests for all using (public.get_user_role() = 'admin');

-- Tuition Info
create policy "Tuition viewable" on public.tuition_info for select using (true);
create policy "Admins manage tuition" on public.tuition_info for all using (public.get_user_role() = 'admin');

-- Front Content
create policy "Active content viewable" on public.front_content for select using (is_active = true);
create policy "Admins manage content" on public.front_content for all using (public.get_user_role() = 'admin');

-- Contact Submissions
create policy "Anyone can submit contact" on public.contact_submissions for insert with check (true);
create policy "Admins manage contacts" on public.contact_submissions for all using (public.get_user_role() = 'admin');

-- Announcements
create policy "Published announcements viewable" on public.announcements for select using (is_published = true);
create policy "Admins manage announcements" on public.announcements for all using (public.get_user_role() = 'admin');

-- Student Usage Notes
create policy "Active usage notes viewable" on public.student_usage_notes for select using (is_active = true);
create policy "Admins manage usage notes" on public.student_usage_notes for all using (public.get_user_role() = 'admin');

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'display_name', coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();
create trigger courses_updated_at before update on public.courses for each row execute procedure public.update_updated_at();
create trigger enrollments_updated_at before update on public.enrollments for each row execute procedure public.update_updated_at();
create trigger classroom_assignments_updated_at before update on public.classroom_assignments for each row execute procedure public.update_updated_at();
create trigger instructor_notes_updated_at before update on public.instructor_notes for each row execute procedure public.update_updated_at();
create trigger print_requests_updated_at before update on public.print_requests for each row execute procedure public.update_updated_at();
create trigger tuition_info_updated_at before update on public.tuition_info for each row execute procedure public.update_updated_at();
create trigger front_content_updated_at before update on public.front_content for each row execute procedure public.update_updated_at();
create trigger contact_submissions_updated_at before update on public.contact_submissions for each row execute procedure public.update_updated_at();
create trigger announcements_updated_at before update on public.announcements for each row execute procedure public.update_updated_at();
create trigger student_usage_notes_updated_at before update on public.student_usage_notes for each row execute procedure public.update_updated_at();
