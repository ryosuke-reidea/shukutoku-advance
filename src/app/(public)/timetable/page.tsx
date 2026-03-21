"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  WEEKDAYS,
  ALL_DAYS,
  WEEKDAY_PERIODS,
  SATURDAY_PERIODS,
  INDIVIDUAL_PERIODS_WEEKDAY,
  INDIVIDUAL_PERIODS_SATURDAY,
  CATEGORY_COLORS,
  INDIVIDUAL_COLOR,
  CATEGORY_LABELS,
} from "@/lib/timetable-constants";

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

import type { CategoryInfo } from "@/lib/types/shared-types";
import { SENIOR_GRADE_CATEGORIES, SENIOR_GRADES, JUNIOR_GRADES } from "@/lib/constants";

interface IndividualSlot {
  day: string;
  period: string;
}

type SchoolTab = "junior" | "senior";


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

  const handleUnifiedApply = useCallback(() => {
    if (selectedCourseIds.size === 0 && selectedIndividualSlots.length === 0) return;
    const params = new URLSearchParams();
    if (selectedCourseIds.size > 0) {
      params.set("courses", Array.from(selectedCourseIds).join(","));
    }
    if (selectedIndividualSlots.length > 0) {
      const slotsParam = selectedIndividualSlots
        .map((s) => `${s.day}-${s.period}`)
        .join(",");
      params.set("slots", slotsParam);
    }
    router.push(`/apply/individual?${params.toString()}`);
  }, [selectedCourseIds, selectedIndividualSlots, router]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: activeTerm } = await supabase
        .from("terms")
        .select("id")
        .eq("is_active", true)
        .single();

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
    setActiveGrade(tab === "senior" ? "高3" : "中3");
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
  const currentGradesWithIndividual = [...currentGrades, "個別"];

  const hasAnySelection = selectedCourseIds.size > 0 || selectedIndividualSlots.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAFCFD" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{ border: "2px solid #E0F7FA", borderTopColor: "#21B8C5" }}
            />
          </div>
          <span className="text-sm" style={{ color: "#21B8C5" }}>読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFCFD" }}>
      {/* ========== Page Header ========== */}
      <section className="page-header" style={{ background: "linear-gradient(180deg, #E8F8FA 0%, #FAFCFD 100%)" }}>
        <div className="relative z-10 max-w-3xl mx-auto space-y-4 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#21B8C5" }}>
            時間割
          </h1>
          <div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ background: "linear-gradient(90deg, #21B8C5, #F6AD3C)" }}
          />
          <p className="text-stone-600 text-base">
            講座をタップして、そのまま申し込みへ進めます
          </p>
        </div>
      </section>

      {/* ========== Tab + Grade Nav (Sticky) ========== */}
      <div
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          borderBottomColor: "#21B8C520",
        }}
      >
        <div className="container mx-auto px-4">
          {/* School Tabs */}
          <div className="flex justify-center gap-3 pt-4 pb-3">
            {(
              [
                { key: "senior" as SchoolTab, label: "高校" },
                { key: "junior" as SchoolTab, label: "中学" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className="relative px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300"
                style={
                  activeTab === tab.key
                    ? {
                        background: "linear-gradient(135deg, #21B8C5, #42D8E8)",
                        color: "white",
                        boxShadow: "0 4px 14px rgba(33,184,197,0.35)",
                      }
                    : {
                        backgroundColor: "#f0f8f9",
                        color: "#21B8C5",
                        border: "2px solid #21B8C530",
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grade Navigation Pills */}
          <div className="flex justify-center gap-2 pb-3">
            {currentGradesWithIndividual.map((grade) => {
              const isActive = activeGrade === grade;
              const isIndividual = grade === "個別";
              return (
                <button
                  key={grade}
                  onClick={() => scrollToGrade(grade)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                  style={
                    isActive
                      ? {
                          background: isIndividual ? INDIVIDUAL_COLOR.gradient : "linear-gradient(135deg, #21B8C5, #42D8E8)",
                          color: "white",
                          boxShadow: isIndividual ? `0 2px 10px ${INDIVIDUAL_COLOR.border}40` : "0 2px 10px rgba(33,184,197,0.30)",
                        }
                      : {
                          backgroundColor: isIndividual ? `${INDIVIDUAL_COLOR.bg}` : "#f0f8f9",
                          color: isIndividual ? INDIVIDUAL_COLOR.text : "#21B8C5",
                          border: `1.5px solid ${isIndividual ? INDIVIDUAL_COLOR.border + '30' : '#21B8C525'}`,
                        }
                  }
                >
                  {grade}
                </button>
              );
            })}
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

            {/* ========== 個別指導セクション ========== */}
            <div
              ref={(el) => { gradeRefs.current["個別"] = el; }}
              className="scroll-mt-36"
            >
              <IndividualSection
                selectedIndividualSlots={selectedIndividualSlots}
                onToggleIndividualSlot={toggleIndividualSlot}
                isIndividualSlotSelected={isIndividualSlotSelected}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== 申し込みフローティングバー（統一） ========== */}
      {hasAnySelection && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl animate-fade-in-up"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            borderTopColor: "#21B8C520",
            boxShadow: "0 -4px 24px rgba(33,184,197,0.10)",
          }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* 選択サマリー */}
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {selectedCourseIds.size > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #21B8C5, #42D8E8)", boxShadow: "0 2px 8px rgba(33,184,197,0.30)" }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    集団 {selectedCourseIds.size}講座
                  </div>
                )}
                {selectedIndividualSlots.length > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0"
                    style={{ background: INDIVIDUAL_COLOR.gradient, boxShadow: `0 2px 8px ${INDIVIDUAL_COLOR.border}30` }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    個別 {selectedIndividualSlots.length}コマ
                  </div>
                )}
              </div>

              {/* ボタン群 */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedCourseIds(new Set());
                    setSelectedIndividualSlots([]);
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all text-stone-500 hover:bg-stone-100"
                  style={{ backgroundColor: "#f0f0f0" }}
                >
                  クリア
                </button>
                <button
                  onClick={handleUnifiedApply}
                  className="px-8 py-3 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #21B8C5, #42D8E8)",
                    boxShadow: "0 4px 20px rgba(33,184,197,0.45)",
                  }}
                >
                  まとめて申し込む →
                </button>
              </div>
            </div>
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
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
          style={{
            background: "linear-gradient(135deg, #21B8C5, #42D8E8)",
            boxShadow: "0 6px 20px rgba(33,184,197,0.30)",
          }}
        >
          {grade}
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#2A2A2A" }}>{grade}</h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            {categorySlugs.map((s) => {
              const c = CATEGORY_COLORS[s] ?? CATEGORY_COLORS.general;
              return (
                <span
                  key={s}
                  className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: c.gradient, color: "white" }}
                >
                  {CATEGORY_LABELS[s] ?? s}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #21B8C530, transparent)" }} />
      </div>

      {/* カテゴリごとに時間割を表示 */}
      {categorySlugs.map((catSlug) => {
        const filteredSlots = filterSlots(grade, [catSlug]);
        const catColor = CATEGORY_COLORS[catSlug] ?? CATEGORY_COLORS.general;
        const catLabel = CATEGORY_LABELS[catSlug] ?? catSlug;

        return (
          <div key={catSlug} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                style={{
                  background: catColor.gradient,
                  color: "white",
                  boxShadow: `0 2px 8px ${catColor.border}25`,
                }}
              >
                {catLabel}
              </div>
              <div
                className="flex-1 h-px"
                style={{ background: `linear-gradient(90deg, ${catColor.border}30, transparent)` }}
              />
            </div>

            {/* 平日テーブル */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: catColor.bg, border: `1px solid ${catColor.border}20` }}
                >
                  <svg className="w-3.5 h-3.5" style={{ color: catColor.border }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: catColor.text }}>
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

            {/* 土曜テーブル */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#FFF6E5", border: "1px solid #F6AD3C20" }}
                >
                  <svg className="w-3.5 h-3.5" style={{ color: "#F6AD3C" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                <h3 className="text-sm font-semibold" style={{ color: "#B87A00" }}>
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
// 個別指導セクション
// ============================================================
function IndividualSection({
  selectedIndividualSlots,
  onToggleIndividualSlot,
  isIndividualSlotSelected,
}: {
  selectedIndividualSlots: IndividualSlot[];
  onToggleIndividualSlot: (day: string, period: string) => void;
  isIndividualSlotSelected: (day: string, period: string) => boolean;
}) {
  const maxPeriods = Math.max(INDIVIDUAL_PERIODS_WEEKDAY.length, INDIVIDUAL_PERIODS_SATURDAY.length);

  return (
    <div className="animate-fade-in-up">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-sm leading-tight text-center"
          style={{
            background: INDIVIDUAL_COLOR.gradient,
            boxShadow: `0 6px 20px ${INDIVIDUAL_COLOR.border}30`,
          }}
        >
          個別<br/>指導
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#2A2A2A" }}>個別指導</h2>
          <p className="text-sm text-stone-500 mt-1">
            ご希望の時間帯をタップして選択（<span className="font-bold" style={{ color: INDIVIDUAL_COLOR.text }}>複数選択可</span>）
          </p>
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${INDIVIDUAL_COLOR.border}30, transparent)` }} />
      </div>

      {/* 個別指導 時間割グリッド */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: `1px solid ${INDIVIDUAL_COLOR.border}20`,
          boxShadow: `0 2px 12px ${INDIVIDUAL_COLOR.border}08`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse timetable-sticky-col" style={{ minWidth: "680px" }}>
            <thead>
              <tr>
                <th
                  className="py-2.5 px-3 text-xs font-bold text-center tracking-wide border-r"
                  style={{ background: INDIVIDUAL_COLOR.gradient, color: "white", width: "100px", borderRightColor: "rgba(255,255,255,0.3)" }}
                >
                  時限
                </th>
                {ALL_DAYS.map((day, i) => (
                  <th
                    key={day}
                    className={`py-2.5 px-2 text-xs font-bold text-center tracking-wide ${i < ALL_DAYS.length - 1 ? "border-r" : ""}`}
                    style={{
                      background: INDIVIDUAL_COLOR.gradient,
                      color: "white",
                      borderRightColor: "rgba(255,255,255,0.3)",
                      minWidth: "90px",
                    }}
                  >
                    {day}曜
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxPeriods }, (_, periodIdx) => {
                const weekdayPeriod = INDIVIDUAL_PERIODS_WEEKDAY[periodIdx];
                const saturdayPeriod = INDIVIDUAL_PERIODS_SATURDAY[periodIdx];
                const label = weekdayPeriod?.label ?? saturdayPeriod?.label ?? `${periodIdx + 1}限`;

                return (
                  <tr
                    key={periodIdx}
                    style={{
                      backgroundColor: periodIdx % 2 === 0 ? "white" : "#f8fafb",
                      borderTop: `1px solid ${INDIVIDUAL_COLOR.border}12`,
                    }}
                  >
                    <td
                      className="py-2.5 px-2 text-center border-r"
                      style={{
                        backgroundColor: periodIdx % 2 === 0 ? `${INDIVIDUAL_COLOR.bg}50` : `${INDIVIDUAL_COLOR.bg}30`,
                        borderRightColor: `${INDIVIDUAL_COLOR.border}15`,
                      }}
                    >
                      <div className="text-sm font-bold" style={{ color: INDIVIDUAL_COLOR.text }}>
                        {label}
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
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
                              <div className="w-5 h-px rounded-full bg-stone-200" />
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
                            onClick={() => onToggleIndividualSlot(day, periodInfo.label)}
                            className="w-full py-4 rounded-xl transition-all duration-200 border-2 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                            style={
                              isSelected
                                ? {
                                    borderColor: INDIVIDUAL_COLOR.border,
                                    backgroundColor: INDIVIDUAL_COLOR.bg,
                                    boxShadow: `0 3px 12px ${INDIVIDUAL_COLOR.border}25`,
                                  }
                                : {
                                    borderColor: `${INDIVIDUAL_COLOR.border}15`,
                                    backgroundColor: `${INDIVIDUAL_COLOR.bg}40`,
                                  }
                            }
                          >
                            {isSelected ? (
                              <div className="flex items-center justify-center">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                                  style={{ backgroundColor: INDIVIDUAL_COLOR.text }}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-stone-500 group-hover:text-stone-600 transition-colors">
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
        <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: `${INDIVIDUAL_COLOR.border}15`, backgroundColor: `${INDIVIDUAL_COLOR.bg}30` }}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-xs font-semibold"
              style={{ backgroundColor: INDIVIDUAL_COLOR.text }}
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
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-md bg-white text-sm border border-stone-200"
                  >
                    <span className="font-semibold" style={{ color: INDIVIDUAL_COLOR.text }}>{slot.day}曜</span>
                    <span className="text-stone-600">{slot.period}</span>
                    {periodInfo && (
                      <span className="text-[10px] text-stone-600">({periodInfo.time})</span>
                    )}
                    <button
                      onClick={() => onToggleIndividualSlot(slot.day, slot.period)}
                      className="ml-0.5 p-0.5 rounded hover:bg-red-50 text-stone-500 hover:text-red-500 transition-colors"
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
  catColor: { bg: string; border: string; text: string; gradient: string; headerBg: string; headerText: string };
  isSaturday: boolean;
  selectedCourseIds: Set<string>;
  onToggleCourse: (courseId: string) => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${catColor.border}20`,
        boxShadow: `0 2px 12px ${catColor.border}08`,
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse timetable-sticky-col" style={{ minWidth: isSaturday ? "380px" : "680px" }}>
          <thead>
            <tr>
              <th
                className="py-3 px-3 text-xs font-bold text-center tracking-wide border-r"
                style={{
                  background: catColor.gradient,
                  color: "white",
                  width: "100px",
                  borderRightColor: "rgba(255,255,255,0.25)",
                }}
              >
                時限
              </th>
              {days.map((day, i) => (
                <th
                  key={day}
                  className={`py-3 px-2 text-xs font-bold text-center tracking-wide ${i < days.length - 1 ? "border-r" : ""}`}
                  style={{
                    background: catColor.gradient,
                    color: "white",
                    borderRightColor: "rgba(255,255,255,0.25)",
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
                style={{
                  backgroundColor: periodIndex % 2 === 0 ? "white" : "#f8fafb",
                  borderTop: `1px solid ${catColor.border}12`,
                }}
              >
                {/* 時限セル */}
                <td
                  className="py-3 px-2 text-center border-r"
                  style={{
                    backgroundColor: periodIndex % 2 === 0 ? `${catColor.bg}50` : `${catColor.bg}30`,
                    borderRightColor: `${catColor.border}15`,
                  }}
                >
                  <div
                    className="text-sm font-bold"
                    style={{ color: catColor.text }}
                  >
                    {period.label}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {period.time}
                  </div>
                </td>
                {/* 曜日セル */}
                {days.map((day, dayIdx) => {
                  const cellSlots = getSlots(filteredSlots, day, periodIndex + 1);
                  return (
                    <td
                      key={`${day}-${period.label}`}
                      className={`p-2 align-top ${dayIdx < days.length - 1 ? "border-r" : ""}`}
                      style={{
                        borderRightColor: `${catColor.border}10`,
                      }}
                    >
                      {cellSlots.length > 0 ? (
                        <div
                          className={`grid gap-1.5 ${
                            cellSlots.length >= 2
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
                        <div className="flex items-center justify-center py-3">
                          <div className="w-4 h-px rounded-full bg-stone-200" />
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
  catColor: { bg: string; border: string; text: string; gradient: string; headerBg: string; headerText: string };
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
            className="rounded-xl overflow-hidden"
            style={{
              border: `1px solid ${catColor.border}20`,
              boxShadow: `0 2px 8px ${catColor.border}08`,
            }}
          >
            {/* 時限ヘッダー */}
            <div
              className="px-3 py-2.5 text-center"
              style={{ background: catColor.gradient }}
            >
              <div className="text-sm font-bold text-white">{period.label}</div>
              <div className="text-[11px] text-white/80">{period.time}</div>
            </div>
            {/* コンテンツ */}
            <div className="p-2 space-y-1.5" style={{ backgroundColor: "white", minHeight: "56px" }}>
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
                  <div className="w-5 h-px rounded-full bg-stone-200" />
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
  color: { bg: string; border: string; text: string; gradient: string; headerBg: string; headerText: string };
  compact: boolean;
  isSelected?: boolean;
  isSelectable?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      onClick={isSelectable ? onToggle : undefined}
      className={`group relative rounded-lg transition-all duration-200 ${
        compact ? "py-2 px-2.5" : "py-2.5 px-3"
      } ${isSelectable ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm" : "opacity-50"}`}
      style={{
        backgroundColor: isSelected ? color.bg : color.bg,
        border: `2px solid ${isSelected ? color.border : `${color.border}35`}`,
        boxShadow: isSelected
          ? `0 4px 14px ${color.border}30`
          : `0 1px 6px ${color.border}10`,
        minHeight: compact ? "40px" : "48px",
      }}
    >
      {/* 選択チェックマーク */}
      {isSelected && (
        <div
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm"
          style={{ background: color.gradient }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* ホバー時の選択ヒント */}
      {!isSelected && isSelectable && (
        <div
          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ backgroundColor: `${color.border}15`, color: color.border }}
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      )}

      {/* 講座名 */}
      <div
        className={`font-bold leading-snug ${compact ? "text-xs" : "text-sm"}`}
        style={{ color: color.text }}
      >
        {slot.course?.name ?? "未設定"}
      </div>

      {/* 情報行 */}
      <div className={`mt-1 space-y-0.5 ${compact ? "text-[10px]" : "text-[11px]"}`}>
        {/* 講師 */}
        {slot.course?.instructor_name && (
          <div className="text-stone-500 truncate">
            {slot.course.instructor_name}
          </div>
        )}
        {/* 教室 */}
        {slot.classroom && (
          <div className="font-medium" style={{ color: `${color.text}bb` }}>
            {slot.classroom}
          </div>
        )}
        {/* 科目 */}
        {slot.course?.subject && (
          <div className="text-stone-400" style={{ fontSize: compact ? "9px" : "10px" }}>
            {slot.course.subject}
          </div>
        )}
      </div>
    </div>
  );
}
