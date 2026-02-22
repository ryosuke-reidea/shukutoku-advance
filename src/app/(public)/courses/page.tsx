"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course, CourseCategory } from "@/lib/types/database";

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

      const [{ data: coursesData }, { data: categoriesData }] =
        await Promise.all([
          supabase.from("courses").select("*").order("subject").order("name"),
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
    const start = course.start_time ?? "";
    const end = course.end_time ?? "";
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
          <Badge variant="default" className="text-xs">
            集団
          </Badge>
        );
      case "individual_1on1":
        return (
          <Badge variant="secondary" className="text-xs">
            個別1対1
          </Badge>
        );
      case "individual_1on2":
        return (
          <Badge variant="secondary" className="text-xs">
            個別1対2
          </Badge>
        );
      case "individual_1on3":
        return (
          <Badge variant="secondary" className="text-xs">
            個別1対3
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">講座紹介</h1>
          <p className="text-muted-foreground">講座情報を読み込み中...</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-lg border bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">講座紹介</h1>
        <p className="text-muted-foreground">
          カテゴリ別・科目別に講座をご覧いただけます
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="space-y-8 mt-6"
          >
            {SUBJECTS.map((subject) => {
              const subjectCourses = getCoursesForCategoryAndSubject(
                category.id,
                subject.id
              );

              if (subjectCourses.length === 0) return null;

              return (
                <div key={subject.id} className="space-y-4">
                  <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
                    {subject.label}
                    <Badge variant="outline" className="text-xs font-normal">
                      {subjectCourses.length}講座
                    </Badge>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {subjectCourses.map((course) => (
                      <Card
                        key={course.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-snug">
                              {course.name}
                            </CardTitle>
                            {getCourseTypeBadge(course.course_type)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {course.instructor_name && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-medium">講師:</span>
                              <span>{course.instructor_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">日時:</span>
                            <span>{formatSchedule(course)}</span>
                          </div>
                          {course.target_grade && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-medium">対象:</span>
                              <span>{course.target_grade}</span>
                            </div>
                          )}
                          {course.description && (
                            <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
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
              <div className="text-center py-12 text-muted-foreground">
                <p>このカテゴリの講座はまだ登録されていません</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
