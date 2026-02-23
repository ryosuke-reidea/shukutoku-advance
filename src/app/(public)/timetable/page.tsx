"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// 時限定義
// ============================================================
const WEEKDAY_PERIODS = [
  { label: "1限", time: "15:30〜16:50" },
  { label: "2限", time: "17:00〜18:20" },
  { label: "3限", time: "18:30〜19:50" },
] as const;

const SATURDAY_PERIODS = [
  { label: "1限", time: "13:10〜14:30" },
  { label: "2限", time: "14:40〜16:00" },
  { label: "3限", time: "16:10〜17:30" },
  { label: "4限", time: "17:40〜19:00" },
] as const;

const WEEKDAYS = ["月", "火", "水", "木", "金"] as const;
const ALL_DAYS = ["月", "火", "水", "木", "金", "土"] as const;

// 個別指導用の時限定義
const INDIVIDUAL_PERIODS_WEEKDAY = [
  { label: "1限", time: "15:30〜16:50" },
  { label: "2限", time: "17:00〜18:20" },
  { label: "3限", time: "18:30〜19:50" },
] as const;

const INDIVIDUAL_PERIODS_SATURDAY = [
  { label: "1限", time: "13:10〜14:30" },
  { label: "2限", time: "14:40〜16:00" },
  { label: "3限", time: "16:10〜17:30" },
  { label: "4限", time: "17:40〜19:00" },
] as const;

// ============================================================
// カテゴリ色 & ラベル
// ============================================================
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  general:        { bg: "#e0f4f8", border: "#1b99a4", text: "#1b99a4", gradient: "linear-gradient(135deg, #1b99a4, #21c5d3)" },
  recommendation: { bg: "#fff3e0", border: "#f6ad3c", text: "#e09520", gradient: "linear-gradient(135deg, #f6ad3c, #f9c76b)" },
  ryugata:        { bg: "#e8f5e9", border: "#4caf50", text: "#2e7d32", gradient: "linear-gradient(135deg, #4caf50, #66bb6a)" },
  junior:         { bg: "#e3f2fd", border: "#2196f3", text: "#1565c0", gradient: "linear-gradient(135deg, #2196f3, #42a5f5)" },
};

const INDIVIDUAL_COLOR = {
  bg: "#f3e8ff",
  border: "#9333ea",
  text: "#7c3aed",
  gradient: "linear-gradient(135deg, #9333ea, #a855f7)",
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "一般",
  recommendation: "推薦",
  ryugata: "留型",
  junior: "中学",
};

// ============================================================
// 型定義
// ============================================================
interface TimetableSlot {
  id: string;
  course_id: string;
  day_of_week: string;
  period: number;
  start_time: string;
  end_time: string;
  classroom: string;
  term: string;
  course: {
    name: string;
    instructor_name: string | null;
    target_grade: string | null;
    subject: string;
    course_type: string;
    category_id: string;
    price: number;
    status: string;
  } | null;
}

interface CategoryInfo {
  id: string;
  slug: string;
  name: string;
}

interface IndividualSlot {
  day: string;
  period: string;
}

type SchoolTab = "junior" | "senior";

// ============================================================
// 高校の学年ごとに表示するカテゴリ
// ============================================================
const SENIOR_GRADE_CATEGORIES: Record<string, string[]> = {
  "高1": ["general", "recommendation"],
  "高2": ["general", "recommendation", "ryugata"],
  "高3": ["general", "recommendation"],
};

// 上の学年から表示
const JUNIOR_GRADES = ["中3", "中2", "中1"];
const SENIOR_GRADES = ["高3", "高2", "高1"];

// ============================================================
// ヘルパー関数
// ============================================================
function getIndividualPeriodsForDay(day: string) {
  return day === "土" ? INDIVIDUAL_PERIODS_SATURDAY : INDIVIDUAL_PERIODS_WEEKDAY;
}

function individualSlotKey(slot: IndividualSlot): string {
  return `${slot.day}-${slot.period}`;
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function TimetablePage() {
  const [activeTab, setActiveTab] = useState<SchoolTab>("senior");
  const [activeGrade, setActiveGrade] = useState<string>("高3");
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [selectedIndividualSlots, setSelectedIndividualSlots] = useState<IndividualSlot[]>([]);
  const gradeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const individualRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const toggleCourse = useCallback((courseId: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }, []);

  const toggleIndividualSlot = useCallback((day: string, period: string) => {
    setSelectedIndividualSlots((prev) => {
      const key = individualSlotKey({ day, period });
      const exists = prev.some((s) => individualSlotKey(s) === key);
      if (exists) {
        return prev.filter((s) => individualSlotKey(s) !== key);
      } else {
        return [...prev, { day, period }];
      }
    });
  }, []);

  const isIndividualSlotSelected = useCallback((day: string, period: string): boolean => {
    return selectedIndividualSlots.some((s) => s.day === day && s.period === period);
  }, [selectedIndividualSlots]);

  const handleApply = useCallback(() => {
    if (selectedCourseIds.size === 0) return;
    const params = new URLSearchParams();
    params.set("courses", Array.from(selectedCourseIds).join(","));
    router.push(`/apply/login?${params.toString()}`);
  }, [selectedCourseIds, router]);

  const handleIndividualApply = useCallback(() => {
    if (selectedIndividualSlots.length === 0) return;
    const slotsParam = selectedIndividualSlots
      .map((s) => `${s.day}-${s.period}`)
      .join(",");
    router.push(`/apply/individual?slots=${encodeURIComponent(slotsParam)}`);
  }, [selectedIndividualSlots, router]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // まずアクティブな会期を取得
      const { data: activeTerm } = await supabase
        .from("terms")
        .select("id")
        .eq("is_active", true)
        .single();

      // 時間割スロットを取得（会期でフィルタ：coursesのterm_idで絞り込む）
      const slotsQuery = supabase
        .from("timetable_slots")
        .select(`
          *,
          course:courses(name, instructor_name, target_grade, subject, course_type, category_id, price, status, term_id)
        `)
        .order("day_of_week")
        .order("period");

      const [slotsRes, catRes] = await Promise.all([
        slotsQuery,
        supabase
          .from("course_categories")
          .select("id, slug, name")
          .order("display_order"),
      ]);

      // アクティブな会期でフィルタ（course.term_id で絞り込み）
      let filteredSlots = (slotsRes.data as TimetableSlot[]) ?? [];
      if (activeTerm?.id) {
        filteredSlots = filteredSlots.filter(
          (slot) => (slot.course as Record<string, unknown>)?.term_id === activeTerm.id
        );
      }

      setTimetableSlots(filteredSlots);
      setCategories((catRes.data as CategoryInfo[]) ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getCategorySlug = useCallback((categoryId: string): string => {
    return categories.find((c) => c.id === categoryId)?.slug ?? "general";
  }, [categories]);

  const filterSlots = useCallback((grade: string, categorySlugs: string[]) => {
    const catIds = categories
      .filter((c) => categorySlugs.includes(c.slug))
      .map((c) => c.id);
    return timetableSlots.filter((slot) => {
      if (!slot.course) return false;
      return (
        slot.course.target_grade === grade &&
        catIds.includes(slot.course.category_id)
      );
    });
  }, [categories, timetableSlots]);

  const getSlots = useCallback((
    slots: TimetableSlot[],
    day: string,
    period: number
  ): TimetableSlot[] => {
    return slots.filter(
      (s) => s.day_of_week === day && s.period === period
    );
  }, []);

  const handleTabChange = (tab: SchoolTab) => {
    setActiveTab(tab);
    const firstGrade = tab === "senior" ? "高3" : "中3";
    setActiveGrade(firstGrade);
  };

  const scrollToGrade = (grade: string) => {
    setActiveGrade(grade);
    const el = gradeRefs.current[grade];
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const currentGrades = activeTab === "senior" ? SENIOR_GRADES : JUNIOR_GRADES;

  const hasAnySelection = selectedCourseIds.size > 0 || selectedIndividualSlots.length > 0;
  const maxIndividualPeriods = Math.max(INDIVIDUAL_PERIODS_WEEKDAY.length, INDIVIDUAL_PERIODS_SATURDAY.length);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fffaf3" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{ border: "3px solid #e0f4f8", borderTopColor: "#1b99a4" }}
            />
            <div
              className="absolute inset-2 rounded-full animate-spin"
              style={{ border: "3px solid #fff3e0", borderTopColor: "#f6ad3c", animationDirection: "reverse", animationDuration: "0.8s" }}
            />
          </div>
          <span className="text-sm text-muted-foreground tracking-wide">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fffaf3" }}>
      {/* ========== Page Header ========== */}
      <section className="page-header">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            時間割
          </h1>
          <div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ backgroundColor: "#1b99a4" }}
          />
          <p className="text-muted-foreground text-lg">
            各学年・カテゴリごとの時間割をご確認いただけます
          </p>
        </div>
      </section>

      {/* ========== Tab + Grade Nav (Sticky) ========== */}
      <div
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(255, 250, 243, 0.92)",
          borderBottomColor: "#e0f4f8",
        }}
      >
        <div className="container mx-auto px-4">
          {/* School Tabs */}
          <div className="flex justify-center gap-3 pt-4 pb-3">
            {(
              [
                { key: "senior" as SchoolTab, label: "高校", icon: "🏫" },
                { key: "junior" as SchoolTab, label: "中学", icon: "📚" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className="relative px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden"
                style={
                  activeTab === tab.key
                    ? {
                        background: "linear-gradient(135deg, #1b99a4, #21c5d3)",
                        color: "white",
                        boxShadow: "0 4px 16px rgba(27,153,164,0.35)",
                        transform: "translateY(-1px)",
                      }
                    : {
                        backgroundColor: "white",
                        color: "#1b99a4",
                        border: "2px solid #e0f4f8",
                      }
                }
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grade Navigation Pills */}
          <div className="flex justify-center gap-2 pb-3">
            {currentGrades.map((grade) => (
              <button
                key={grade}
                onClick={() => scrollToGrade(grade)}
                className="relative px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                style={
                  activeGrade === grade
                    ? {
                        background: "linear-gradient(135deg, #f6ad3c, #f9c76b)",
                        color: "white",
                        boxShadow: "0 2px 10px rgba(246,173,60,0.35)",
                      }
                    : {
                        backgroundColor: "#f5f0e8",
                        color: "#8b7355",
                      }
                }
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== Content ========== */}
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-20">
            {currentGrades.map((grade) => {
              const categorySlugs =
                activeTab === "senior"
                  ? SENIOR_GRADE_CATEGORIES[grade]
                  : ["junior"];
              return (
                <div
                  key={grade}
                  ref={(el) => { gradeRefs.current[grade] = el; }}
                  className="scroll-mt-36"
                >
                  <GradeSection
                    grade={grade}
                    categorySlugs={categorySlugs}
                    filterSlots={filterSlots}
                    getSlots={getSlots}
                    getCategorySlug={getCategorySlug}
                    selectedCourseIds={selectedCourseIds}
                    onToggleCourse={toggleCourse}
                  />
                </div>
              );
            })}
          </div>

          {/* ========== 個別指導セクション ========== */}
          <div ref={individualRef} className="mt-20 scroll-mt-36">
            <div className="animate-fade-in-up">
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-10">
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-lg overflow-hidden"
                  style={{
                    background: INDIVIDUAL_COLOR.gradient,
                    boxShadow: "0 8px 24px rgba(147,51,234,0.3)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, white 0%, transparent 60%)",
                    }}
                  />
                  <span className="relative text-sm leading-tight text-center">個別<br/>指導</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">個別指導</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    ご希望の時間帯をタップして選択してください（<span className="font-bold" style={{ color: INDIVIDUAL_COLOR.text }}>複数選択可</span>）
                  </p>
                </div>
                <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${INDIVIDUAL_COLOR.border} 0%, rgba(147,51,234,0.1) 60%, transparent 100%)` }} />
              </div>

              {/* 個別指導 時間割グリッド */}
              <div
                className="rounded-2xl overflow-hidden border"
                style={{
                  borderColor: `${INDIVIDUAL_COLOR.border}25`,
                  boxShadow: `0 4px 20px ${INDIVIDUAL_COLOR.border}10, 0 1px 3px rgba(0,0,0,0.04)`,
                }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: "680px" }}>
                    <thead>
                      <tr>
                        <th
                          className="py-3 px-3 text-xs font-bold text-white text-center"
                          style={{ background: INDIVIDUAL_COLOR.gradient, width: "100px" }}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>時限</span>
                          </div>
                        </th>
                        {ALL_DAYS.map((day) => (
                          <th
                            key={day}
                            className="py-3 px-2 text-xs font-bold text-white text-center"
                            style={{
                              background: day === "土"
                                ? "linear-gradient(135deg, #f6ad3c, #f9c76b)"
                                : INDIVIDUAL_COLOR.gradient,
                              minWidth: "90px",
                            }}
                          >
                            {day}曜
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: maxIndividualPeriods }, (_, periodIdx) => {
                        const weekdayPeriod = INDIVIDUAL_PERIODS_WEEKDAY[periodIdx];
                        const saturdayPeriod = INDIVIDUAL_PERIODS_SATURDAY[periodIdx];
                        const label = weekdayPeriod?.label ?? saturdayPeriod?.label ?? `${periodIdx + 1}限`;

                        return (
                          <tr
                            key={periodIdx}
                            className="transition-colors"
                            style={{
                              backgroundColor: periodIdx % 2 === 0 ? "white" : "#fafaf8",
                            }}
                          >
                            <td
                              className="py-3 px-2 text-center border-r"
                              style={{
                                backgroundColor: `${INDIVIDUAL_COLOR.bg}80`,
                                borderRightColor: `${INDIVIDUAL_COLOR.border}20`,
                              }}
                            >
                              <div className="text-sm font-black" style={{ color: INDIVIDUAL_COLOR.text }}>
                                {label}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                {weekdayPeriod?.time ?? saturdayPeriod?.time ?? ""}
                              </div>
                            </td>
                            {ALL_DAYS.map((day) => {
                              const periods = getIndividualPeriodsForDay(day);
                              const periodInfo = periods[periodIdx];
                              const isAvailable = !!periodInfo;
                              const isSelected = isAvailable && isIndividualSlotSelected(day, periodInfo.label);

                              if (!isAvailable) {
                                return (
                                  <td
                                    key={day}
                                    className="p-1.5 align-middle text-center border-r last:border-r-0"
                                    style={{ borderRightColor: `${INDIVIDUAL_COLOR.border}10` }}
                                  >
                                    <div className="flex items-center justify-center py-4">
                                      <div className="w-5 h-[2px] rounded-full" style={{ backgroundColor: `${INDIVIDUAL_COLOR.border}15` }} />
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={day}
                                  className="p-1.5 align-middle text-center border-r last:border-r-0"
                                  style={{ borderRightColor: `${INDIVIDUAL_COLOR.border}10` }}
                                >
                                  <button
                                    onClick={() => toggleIndividualSlot(day, periodInfo.label)}
                                    className="w-full py-4 rounded-xl transition-all duration-200 border-2 cursor-pointer group"
                                    style={
                                      isSelected
                                        ? {
                                            borderColor: INDIVIDUAL_COLOR.border,
                                            backgroundColor: INDIVIDUAL_COLOR.bg,
                                            boxShadow: `0 2px 8px ${INDIVIDUAL_COLOR.border}30`,
                                            transform: "scale(1.02)",
                                          }
                                        : {
                                            borderColor: "#e2e8f0",
                                            backgroundColor: "white",
                                          }
                                    }
                                  >
                                    {isSelected ? (
                                      <div className="flex items-center justify-center">
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                                          style={{ background: INDIVIDUAL_COLOR.gradient }}
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                            <path d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-400 group-hover:text-purple-400 transition-colors">
                                        選択
                                      </div>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 個別指導 選択済みチップ */}
              {selectedIndividualSlots.length > 0 && (
                <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: `${INDIVIDUAL_COLOR.border}30`, backgroundColor: `${INDIVIDUAL_COLOR.bg}30` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold"
                      style={{ background: INDIVIDUAL_COLOR.gradient }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {selectedIndividualSlots.length}コマ選択中
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...selectedIndividualSlots]
                      .sort((a, b) => {
                        const dayOrder = [...ALL_DAYS].indexOf(a.day as typeof ALL_DAYS[number]) - [...ALL_DAYS].indexOf(b.day as typeof ALL_DAYS[number]);
                        if (dayOrder !== 0) return dayOrder;
                        return a.period.localeCompare(b.period);
                      })
                      .map((slot) => {
                        const periods = getIndividualPeriodsForDay(slot.day);
                        const periodInfo = periods.find((p) => p.label === slot.period);
                        return (
                          <div
                            key={individualSlotKey(slot)}
                            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-white text-sm"
                            style={{ border: `1px solid ${INDIVIDUAL_COLOR.border}30` }}
                          >
                            <span className="font-bold" style={{ color: INDIVIDUAL_COLOR.text }}>{slot.day}曜</span>
                            <span className="text-slate-600">{slot.period}</span>
                            {periodInfo && (
                              <span className="text-[10px] text-muted-foreground">({periodInfo.time})</span>
                            )}
                            <button
                              onClick={() => toggleIndividualSlot(slot.day, slot.period)}
                              className="ml-0.5 p-0.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========== 申し込みフローティングバー ========== */}
      {hasAnySelection && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl animate-fade-in-up"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderTopColor: "#1b99a4",
            boxShadow: "0 -4px 24px rgba(27,153,164,0.15)",
          }}
        >
          <div className="container mx-auto px-4 py-3 space-y-2">
            {/* 集団授業の選択 */}
            {selectedCourseIds.size > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #1b99a4, #21c5d3)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {selectedCourseIds.size}講座選択中
                  </div>
                  <div className="text-sm text-muted-foreground hidden md:block">
                    {(() => {
                      const selectedSlots = timetableSlots.filter(
                        (s) => selectedCourseIds.has(s.course_id)
                      );
                      const uniqueCourses = new Map<string, TimetableSlot>();
                      selectedSlots.forEach((s) => {
                        if (!uniqueCourses.has(s.course_id)) uniqueCourses.set(s.course_id, s);
                      });
                      const totalPrice = Array.from(uniqueCourses.values()).reduce(
                        (sum, s) => sum + (s.course?.price || 0), 0
                      );
                      return `合計: ¥${totalPrice.toLocaleString()}`;
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCourseIds(new Set())}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{ color: "#8b7355", backgroundColor: "#f5f0e8" }}
                  >
                    クリア
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #f6ad3c, #e09520)",
                      boxShadow: "0 4px 16px rgba(246,173,60,0.35)",
                    }}
                  >
                    この講座で申し込む →
                  </button>
                </div>
              </div>
            )}

            {/* 個別指導の選択 */}
            {selectedIndividualSlots.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: INDIVIDUAL_COLOR.gradient }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    個別指導 {selectedIndividualSlots.length}コマ選択中
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedIndividualSlots([])}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{ color: "#8b7355", backgroundColor: "#f5f0e8" }}
                  >
                    クリア
                  </button>
                  <button
                    onClick={handleIndividualApply}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                    style={{
                      background: INDIVIDUAL_COLOR.gradient,
                      boxShadow: `0 4px 16px ${INDIVIDUAL_COLOR.border}35`,
                    }}
                  >
                    個別指導を申し込む →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 学年セクション
// ============================================================
function GradeSection({
  grade,
  categorySlugs,
  filterSlots,
  getSlots,
  getCategorySlug,
  selectedCourseIds,
  onToggleCourse,
}: {
  grade: string;
  categorySlugs: string[];
  filterSlots: (grade: string, cats: string[]) => TimetableSlot[];
  getSlots: (slots: TimetableSlot[], day: string, period: number) => TimetableSlot[];
  getCategorySlug: (categoryId: string) => string;
  selectedCourseIds: Set<string>;
  onToggleCourse: (courseId: string) => void;
}) {
  return (
    <div className="animate-fade-in-up">
      {/* Grade Header */}
      <div className="flex items-center gap-4 mb-10">
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1b99a4, #21c5d3)",
            boxShadow: "0 8px 24px rgba(27,153,164,0.3)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: "radial-gradient(circle at 30% 30%, white 0%, transparent 60%)",
            }}
          />
          <span className="relative">{grade}</span>
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{grade}</h2>
          <div className="flex items-center gap-2 mt-1">
            {categorySlugs.map((s) => {
              const c = CATEGORY_COLORS[s] ?? CATEGORY_COLORS.general;
              return (
                <span
                  key={s}
                  className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: c.bg, color: c.text }}
                >
                  {CATEGORY_LABELS[s] ?? s}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex-1 h-[2px]" style={{ background: "linear-gradient(90deg, #1b99a4 0%, rgba(27,153,164,0.1) 60%, transparent 100%)" }} />
      </div>

      {/* カテゴリごとに時間割を表示 */}
      {categorySlugs.map((catSlug) => {
        const filteredSlots = filterSlots(grade, [catSlug]);
        const catColor = CATEGORY_COLORS[catSlug] ?? CATEGORY_COLORS.general;
        const catLabel = CATEGORY_LABELS[catSlug] ?? catSlug;
        const showCategoryLabel = categorySlugs.length > 1;

        return (
          <div key={catSlug} className="mb-12 last:mb-0">
            {showCategoryLabel && (
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{
                    background: catColor.gradient,
                    boxShadow: `0 4px 12px ${catColor.border}40`,
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {catLabel}
                </div>
                <div
                  className="flex-1 h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${catColor.border}50, transparent)` }}
                />
              </div>
            )}

            {/* 平日テーブル */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: catColor.bg }}
                >
                  <svg className="w-3.5 h-3.5" style={{ color: catColor.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold" style={{ color: catColor.text }}>
                  月〜金曜日
                </h3>
              </div>
              <TimetableTable
                days={[...WEEKDAYS]}
                periods={[...WEEKDAY_PERIODS]}
                filteredSlots={filteredSlots}
                getSlots={getSlots}
                getCategorySlug={getCategorySlug}
                catColor={catColor}
                isSaturday={false}
                selectedCourseIds={selectedCourseIds}
                onToggleCourse={onToggleCourse}
              />
            </div>

            {/* 土曜テーブル（コンパクト横並び） */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#fff3e0" }}
                >
                  <svg className="w-3.5 h-3.5" style={{ color: "#e09520" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold" style={{ color: "#e09520" }}>
                  土曜日
                </h3>
              </div>
              <SaturdayCompact
                periods={[...SATURDAY_PERIODS]}
                filteredSlots={filteredSlots}
                getSlots={getSlots}
                getCategorySlug={getCategorySlug}
                catColor={catColor}
                selectedCourseIds={selectedCourseIds}
                onToggleCourse={onToggleCourse}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 時間割テーブルコンポーネント
// ============================================================
function TimetableTable({
  days,
  periods,
  filteredSlots,
  getSlots,
  getCategorySlug,
  catColor,
  isSaturday,
  selectedCourseIds,
  onToggleCourse,
}: {
  days: string[];
  periods: readonly { label: string; time: string }[];
  filteredSlots: TimetableSlot[];
  getSlots: (slots: TimetableSlot[], day: string, period: number) => TimetableSlot[];
  getCategorySlug: (categoryId: string) => string;
  catColor: { bg: string; border: string; text: string; gradient: string };
  isSaturday: boolean;
  selectedCourseIds: Set<string>;
  onToggleCourse: (courseId: string) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: `${catColor.border}25`,
        boxShadow: `0 4px 20px ${catColor.border}10, 0 1px 3px rgba(0,0,0,0.04)`,
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: isSaturday ? "380px" : "680px" }}>
          <thead>
            <tr>
              <th
                className="py-3 px-3 text-xs font-bold text-white text-center"
                style={{
                  background: catColor.gradient,
                  width: "100px",
                }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>時限</span>
                </div>
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="py-3 px-2 text-xs font-bold text-white text-center"
                  style={{
                    background: catColor.gradient,
                    minWidth: isSaturday ? "260px" : "110px",
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, periodIndex) => (
              <tr
                key={period.label}
                className="transition-colors"
                style={{
                  backgroundColor: periodIndex % 2 === 0 ? "white" : "#fafaf8",
                }}
              >
                {/* 時限セル */}
                <td
                  className="py-3 px-2 text-center border-r"
                  style={{
                    backgroundColor: `${catColor.bg}80`,
                    borderRightColor: `${catColor.border}20`,
                  }}
                >
                  <div
                    className="text-sm font-black"
                    style={{ color: catColor.text }}
                  >
                    {period.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    {period.time}
                  </div>
                </td>
                {/* 曜日セル */}
                {days.map((day) => {
                  const cellSlots = getSlots(filteredSlots, day, periodIndex + 1);
                  return (
                    <td
                      key={`${day}-${period.label}`}
                      className="p-1.5 align-top border-r last:border-r-0"
                      style={{
                        borderRightColor: `${catColor.border}10`,
                      }}
                    >
                      {cellSlots.length > 0 ? (
                        <div
                          className={`grid gap-1.5 ${
                            cellSlots.length >= 3
                              ? "grid-cols-2"
                              : cellSlots.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-1"
                          }`}
                        >
                          {cellSlots.map((slot) => {
                            const slug = slot.course
                              ? getCategorySlug(slot.course.category_id)
                              : "general";
                            const slotColor =
                              CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.general;
                            const isOpen = slot.course?.status === "open";
                            return (
                              <SlotCard
                                key={slot.id}
                                slot={slot}
                                color={slotColor}
                                compact={cellSlots.length >= 2}
                                isSelected={selectedCourseIds.has(slot.course_id)}
                                isSelectable={isOpen}
                                onToggle={() => isOpen && onToggleCourse(slot.course_id)}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-4">
                          <div
                            className="w-5 h-[2px] rounded-full"
                            style={{ backgroundColor: `${catColor.border}15` }}
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 土曜コンパクト表示（横並びカード）
// ============================================================
function SaturdayCompact({
  periods,
  filteredSlots,
  getSlots,
  getCategorySlug,
  catColor,
  selectedCourseIds,
  onToggleCourse,
}: {
  periods: readonly { label: string; time: string }[];
  filteredSlots: TimetableSlot[];
  getSlots: (slots: TimetableSlot[], day: string, period: number) => TimetableSlot[];
  getCategorySlug: (categoryId: string) => string;
  catColor: { bg: string; border: string; text: string; gradient: string };
  selectedCourseIds: Set<string>;
  onToggleCourse: (courseId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {periods.map((period, periodIndex) => {
        const cellSlots = getSlots(filteredSlots, "土", periodIndex + 1);
        return (
          <div
            key={period.label}
            className="rounded-xl overflow-hidden border"
            style={{
              borderColor: `${catColor.border}20`,
              boxShadow: `0 2px 8px ${catColor.border}08`,
            }}
          >
            {/* 時限ヘッダー */}
            <div
              className="px-3 py-2 text-center"
              style={{ background: catColor.gradient }}
            >
              <div className="text-xs font-black text-white">{period.label}</div>
              <div className="text-[9px] text-white/80 font-medium">{period.time}</div>
            </div>
            {/* コンテンツ */}
            <div className="p-2 space-y-1.5" style={{ backgroundColor: "white", minHeight: "60px" }}>
              {cellSlots.length > 0 ? (
                cellSlots.map((slot) => {
                  const slug = slot.course
                    ? getCategorySlug(slot.course.category_id)
                    : "general";
                  const slotColor = CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.general;
                  const isOpen = slot.course?.status === "open";
                  return (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      color={slotColor}
                      compact={true}
                      isSelected={selectedCourseIds.has(slot.course_id)}
                      isSelectable={isOpen}
                      onToggle={() => isOpen && onToggleCourse(slot.course_id)}
                    />
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full py-3">
                  <div
                    className="w-5 h-[2px] rounded-full"
                    style={{ backgroundColor: `${catColor.border}15` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// スロットカード（1講座分 - 教室情報統合）
// ============================================================
function SlotCard({
  slot,
  color,
  compact,
  isSelected = false,
  isSelectable = true,
  onToggle,
}: {
  slot: TimetableSlot;
  color: { bg: string; border: string; text: string; gradient: string };
  compact: boolean;
  isSelected?: boolean;
  isSelectable?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      onClick={isSelectable ? onToggle : undefined}
      className={`group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        compact ? "p-2" : "p-2.5"
      } ${isSelectable ? "cursor-pointer" : ""}`}
      style={{
        backgroundColor: isSelected ? `${color.bg}` : `${color.bg}60`,
        border: isSelected
          ? `2.5px solid ${color.border}`
          : `1.5px solid ${color.border}30`,
        boxShadow: isSelected ? `0 0 0 2px ${color.border}20` : undefined,
      }}
    >
      {/* 上部アクセントライン */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ background: color.gradient }}
      />

      {/* 選択チェックマーク */}
      {isSelected && (
        <div
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
          style={{ background: color.gradient, boxShadow: `0 2px 6px ${color.border}40` }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* 講座名 */}
      <div
        className={`font-bold leading-snug mt-0.5 ${compact ? "text-[11px]" : "text-xs"}`}
        style={{ color: "#2d3748" }}
      >
        {slot.course?.name ?? "未設定"}
      </div>

      {/* 情報行 */}
      <div className={`mt-1.5 space-y-1 ${compact ? "text-[9px]" : "text-[10px]"}`}>
        {/* 教室 (統合) */}
        {slot.classroom && (
          <div className="flex items-center gap-1">
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold"
              style={{
                backgroundColor: color.bg,
                color: color.text,
                fontSize: compact ? "8px" : "9px",
              }}
            >
              <svg
                className="flex-shrink-0"
                style={{ width: compact ? "8px" : "9px", height: compact ? "8px" : "9px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              {slot.classroom}
            </span>
          </div>
        )}

        {/* 講師 */}
        {slot.course?.instructor_name && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <svg
              className="flex-shrink-0 opacity-60"
              style={{
                color: color.text,
                width: compact ? "9px" : "10px",
                height: compact ? "9px" : "10px",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="truncate">{slot.course.instructor_name}</span>
          </div>
        )}

        {/* 科目バッジ */}
        {slot.course?.subject && (
          <span
            className="inline-block px-1.5 py-0.5 rounded-md font-bold"
            style={{
              fontSize: compact ? "7px" : "8px",
              backgroundColor: `${color.border}15`,
              color: color.text,
            }}
          >
            {slot.course.subject}
          </span>
        )}
      </div>
    </div>
  );
}
