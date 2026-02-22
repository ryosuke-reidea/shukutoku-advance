"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course, CourseCategory } from "@/lib/types/database";
import { formatTime } from "@/lib/utils";

const SUBJECTS = [
  { id: "英語", label: "英語" },
  { id: "数学", label: "数学" },
  { id: "国語", label: "国語" },
  { id: "理科", label: "理科" },
  { id: "社会", label: "社会" },
] as const;

const DAY_LABELS: Record<string, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  月: "月",
  火: "火",
  水: "水",
  木: "木",
  金: "金",
  土: "土",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // まずアクティブな会期を取得
      const { data: activeTerm } = await supabase
        .from("terms")
        .select("id")
        .eq("is_active", true)
        .single();

      // 会期でフィルタして講座を取得
      let coursesQuery = supabase.from("courses").select("*").order("subject").order("name");
      if (activeTerm?.id) {
        coursesQuery = coursesQuery.eq("term_id", activeTerm.id);
      }

      const [{ data: coursesData }, { data: categoriesData }] =
        await Promise.all([
          coursesQuery,
          supabase.from("course_categories").select("*").order("display_order"),
        ]);

      setCourses(coursesData ?? []);
      const cats = (categoriesData ?? []) as CourseCategory[];
      setCategories(cats);
      if (cats.length > 0) setActiveTab(cats[0].id);
      setLoading(false);
    }

    fetchData();
  }, []);

  const getCoursesForCategoryAndSubject = (
    categoryId: string,
    subjectId: string
  ) => {
    return courses.filter(
      (course) =>
        course.category_id === categoryId && course.subject === subjectId
    );
  };

  const formatSchedule = (course: Course) => {
    const day = course.day_of_week
      ? DAY_LABELS[course.day_of_week] ?? course.day_of_week
      : "";
    const start = formatTime(course.start_time);
    const end = formatTime(course.end_time);
    const time = start && end ? `${start}〜${end}` : start || end || "";
    if (day && time) return `${day}曜 ${time}`;
    if (day) return `${day}曜`;
    if (time) return time;
    return "未定";
  };

  const getCourseTypeBadge = (type: string | null | undefined) => {
    switch (type) {
      case "group":
        return (
          <Badge className="text-xs bg-[#1b99a4] hover:bg-[#158a94] text-white border-none">
            集団
          </Badge>
        );
      case "individual_1on1":
        return (
          <Badge className="text-xs bg-[#f6ad3c] hover:bg-[#e89a20] text-white border-none">
            個別1対1
          </Badge>
        );
      case "individual_1on2":
        return (
          <Badge className="text-xs bg-[#f8c06a] hover:bg-[#f6ad3c] text-[#181818] border-none">
            個別1対2
          </Badge>
        );
      case "individual_1on3":
        return (
          <Badge className="text-xs bg-[#f8c06a] hover:bg-[#f6ad3c] text-[#181818] border-none">
            個別1対3
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#fffaf3" }}>
        {/* Page Header Skeleton */}
        <div className="page-header">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              講座紹介
            </h1>
            <p className="text-muted-foreground text-lg">
              講座情報を読み込み中...
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl border-l-4 bg-white animate-pulse"
                style={{ borderLeftColor: "#1b99a4" }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fffaf3" }}>
      {/* Page Header */}
      <section className="page-header">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            講座紹介
          </h1>
          <div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ backgroundColor: "#1b99a4" }}
          />
          <p className="text-muted-foreground text-lg">
            カテゴリ別・科目別に講座をご覧いただけます
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 lg:py-20 space-y-10">
        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in-up animation-delay-200">
          <TabsList
            className="flex w-full overflow-x-auto rounded-xl p-1 sm:grid"
            style={{
              gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
              backgroundColor: "#e0f4f8",
            }}
          >
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="shrink-0 rounded-lg text-sm font-medium transition-all data-[state=active]:text-white data-[state=active]:shadow-md"
                style={
                  activeTab === category.id
                    ? {
                        backgroundColor: "#1b99a4",
                        color: "white",
                      }
                    : {}
                }
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent
              key={category.id}
              value={category.id}
              className="space-y-12 mt-8"
            >
              {SUBJECTS.map((subject) => {
                const subjectCourses = getCoursesForCategoryAndSubject(
                  category.id,
                  subject.id
                );

                if (subjectCourses.length === 0) return null;

                return (
                  <div key={subject.id} className="space-y-6 animate-fade-in-up">
                    {/* Subject Section Header */}
                    <div className="flex items-center gap-4">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm"
                        style={{ backgroundColor: "#1b99a4" }}
                      >
                        {subject.label.charAt(0)}
                      </div>
                      <h2 className="text-xl font-bold tracking-tight">
                        {subject.label}
                      </h2>
                      <Badge
                        variant="outline"
                        className="text-xs font-normal border-[#1b99a4]/30"
                        style={{ color: "#1b99a4" }}
                      >
                        {subjectCourses.length}講座
                      </Badge>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#1b99a4]/20 to-transparent" />
                    </div>

                    {/* Course Cards Grid */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {subjectCourses.map((course, index) => (
                        <Card
                          key={course.id}
                          className="hover-lift border-l-4 bg-white/80 backdrop-blur-sm overflow-hidden"
                          style={{
                            borderLeftColor: "#1b99a4",
                            animationDelay: `${index * 100}ms`,
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-snug font-bold">
                                {course.name}
                              </CardTitle>
                              {getCourseTypeBadge(course.course_type)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2.5 text-sm">
                            {course.instructor_name && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <svg
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{ color: "#1b99a4" }}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span className="font-medium">講師:</span>
                                <span>{course.instructor_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <svg
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: "#1b99a4" }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span className="font-medium">日時:</span>
                              <span>{formatSchedule(course)}</span>
                            </div>
                            {course.target_grade && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <svg
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{ color: "#1b99a4" }}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="9" cy="7" r="4" />
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span className="font-medium">対象:</span>
                                <span>{course.target_grade}</span>
                              </div>
                            )}
                            {course.description && (
                              <p className="text-muted-foreground text-xs mt-3 leading-relaxed pt-2.5 border-t border-dashed border-[#1b99a4]/15">
                                {course.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Show message if no courses in this category */}
              {SUBJECTS.every(
                (subject) =>
                  getCoursesForCategoryAndSubject(category.id, subject.id)
                    .length === 0
              ) && (
                <div className="text-center py-16 text-muted-foreground">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: "#e0f4f8" }}
                  >
                    <svg
                      className="w-8 h-8"
                      style={{ color: "#1b99a4" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">このカテゴリの講座はまだ登録されていません</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
