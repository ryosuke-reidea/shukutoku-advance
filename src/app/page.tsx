"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  Shield,
  Clock,
  BookOpen,
  Coins,
  Users,
  GraduationCap,
  ArrowRight,
  Phone,
  ChevronDown,
  MessageCircle,
  Star,
  CheckCircle,
  Calendar,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ============================================
   Data
   ============================================ */

const merits = [
  {
    icon: Shield,
    title: "学校内なので安心・安全",
    description:
      "授業が行われるのは学校内。保護者の方も安心してお子様を預けることができます。",
  },
  {
    icon: Clock,
    title: "移動時間ゼロ",
    description:
      "学校内で授業が受けられるため、予備校への移動時間がゼロ。その分を学習に充てられます。",
  },
  {
    icon: BookOpen,
    title: "授業内容とリンク",
    description:
      "学校の授業内容と連携したカリキュラムで、より深い理解と確実な学力向上を実現します。",
  },
  {
    icon: Coins,
    title: "圧倒的な低価格",
    description:
      "一般的な予備校と比較して圧倒的な低価格。質の高い授業を家計にやさしい料金で受講できます。",
  },
];

const courseTypes = [
  {
    icon: Users,
    title: "集団授業",
    subtitle: "Group Class",
    description: "80分の集団授業。レベル別カリキュラムで全科目に対応。",
    detail: "早慶国立クラス・GMARCHクラスなど、志望校に合わせた講座を用意。",
    color: "#1b99a4",
  },
  {
    icon: GraduationCap,
    title: "個別指導",
    subtitle: "Private Tutoring",
    description: "1対1、1対2、1対3の個別指導。医学部プレミアムコースも。",
    detail: "淑徳OB・OGの大学生チューターが丁寧に指導します。",
    color: "#f6ad3c",
  },
  {
    icon: MessageCircle,
    title: "質問ルーム",
    subtitle: "Question Room",
    description: "利用料無料。淑徳OB・OGチューターに自由に質問できます。",
    detail: "平日 16:30-20:00 / 土曜 13:30-17:30",
    color: "#4caf50",
  },
];

const stats = [
  { value: "10年以上", label: "の指導実績" },
  { value: "5科目", label: "対応" },
  { value: "3つ", label: "の学習形態" },
  { value: "圧倒的", label: "低価格" },
];

const testimonials = [
  {
    text: "学校の後すぐに授業が受けられるので、時間を無駄にしない。先生方も熱心で、苦手だった数学が得意科目になりました。",
    grade: "高3",
    initial: "A",
  },
  {
    text: "個別指導で自分のペースで学べるのが良い。質問ルームも気軽に使えて、テスト前は毎日通っています。",
    grade: "高2",
    initial: "K",
  },
  {
    text: "推薦対策のクラスがあるのが嬉しい。面接練習や小論文指導もしてもらえて、志望校に合格できました。",
    grade: "高3",
    initial: "S",
  },
];

/* ============================================
   Scroll Animation Hook
   ============================================ */

function useScrollAnimation() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
    }

    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return observe;
}

/* ============================================
   Animated Counter Hook
   ============================================ */

function useCounterAnimation(
  targetText: string,
  isVisible: boolean,
  duration: number = 1500
) {
  const [display, setDisplay] = useState(targetText);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;

    const match = targetText.match(/(\d+)/);
    if (!match) {
      setDisplay(targetText);
      hasAnimated.current = true;
      return;
    }

    const targetNum = parseInt(match[1], 10);
    const prefix = targetText.slice(0, match.index);
    const suffix = targetText.slice((match.index ?? 0) + match[1].length);

    hasAnimated.current = true;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentNum = Math.round(eased * targetNum);

      setDisplay(`${prefix}${currentNum}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, targetText, duration]);

  return display;
}

/* ============================================
   Stat Card Component
   ============================================ */

function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const animatedValue = useCounterAnimation(value, isVisible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="text-4xl font-black sm:text-5xl lg:text-6xl animate-pulse-glow">{animatedValue}</div>
      <div className="mt-2 text-lg font-medium text-white/80">{label}</div>
    </div>
  );
}

/* ============================================
   Mock Image Components (SVG-based)
   ============================================ */

function HeroMockImage() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-teal-50 to-cyan-50 aspect-[4/3]">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          <rect width="400" height="300" fill="#f0fafa" />
          <rect x="0" y="0" width="400" height="60" fill="#e8f4f5" />
          <rect x="80" y="15" width="240" height="35" rx="3" fill="white" stroke="#1b99a4" strokeWidth="2" />
          <text x="200" y="38" textAnchor="middle" fill="#1b99a4" fontSize="12" fontWeight="bold">SHUKUTOKU ADVANCE</text>
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <g key={`${row}-${col}`} transform={`translate(${60 + col * 80}, ${90 + row * 65})`}>
                <rect x="0" y="20" width="60" height="25" rx="3" fill="#d4e8ea" stroke="#1b99a4" strokeWidth="0.5" />
                <circle cx="30" cy="10" r="10" fill={row === 1 && col === 1 ? "#f6ad3c" : "#1b99a4"} opacity="0.7" />
                <rect x="20" y="18" width="20" height="8" rx="3" fill={row === 1 && col === 1 ? "#f6ad3c" : "#1b99a4"} opacity="0.5" />
              </g>
            ))
          )}
          <circle cx="200" cy="70" r="14" fill="#1b99a4" />
          <rect x="190" y="82" width="20" height="12" rx="4" fill="#1b99a4" opacity="0.8" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 to-transparent" />
      </div>
      <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#f6ad3c]/10 flex items-center justify-center">
          <Star className="w-4 h-4 text-[#f6ad3c]" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700">満足度</p>
          <p className="text-sm font-black text-[#1b99a4]">98%</p>
        </div>
      </div>
      <div className="absolute -top-3 -left-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#1b99a4]/10 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-[#1b99a4]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500">受講生</p>
          <p className="text-xs font-black text-[#1b99a4]">200名+</p>
        </div>
      </div>
    </div>
  );
}

function CourseTypeMockImage({ type }: { type: "group" | "individual" | "question" }) {
  return (
    <div className={`rounded-t-xl overflow-hidden aspect-[16/9] ${
      type === "group" ? "bg-gradient-to-br from-teal-50 to-cyan-50" :
      type === "individual" ? "bg-gradient-to-br from-orange-50 to-amber-50" :
      "bg-gradient-to-br from-green-50 to-emerald-50"
    }`}>
      <svg viewBox="0 0 320 180" className="w-full h-full">
        {type === "group" && (
          <>
            <rect x="60" y="10" width="200" height="40" rx="4" fill="white" stroke="#1b99a4" strokeWidth="1.5" />
            <text x="160" y="35" textAnchor="middle" fill="#1b99a4" fontSize="10" fontWeight="bold">集団授業</text>
            {[0, 1].map((row) =>
              [0, 1, 2].map((col) => (
                <g key={`${row}-${col}`} transform={`translate(${70 + col * 70}, ${70 + row * 50})`}>
                  <rect x="0" y="15" width="50" height="20" rx="3" fill="#1b99a420" />
                  <circle cx="25" cy="8" r="8" fill="#1b99a4" opacity="0.6" />
                </g>
              ))
            )}
            <circle cx="160" cy="58" r="10" fill="#1b99a4" />
          </>
        )}
        {type === "individual" && (
          <>
            <text x="160" y="25" textAnchor="middle" fill="#f6ad3c" fontSize="14" fontWeight="bold">1 : 1 個別指導</text>
            <rect x="80" y="80" width="160" height="50" rx="6" fill="#f6ad3c15" stroke="#f6ad3c" strokeWidth="1" />
            <circle cx="160" cy="60" r="14" fill="#f6ad3c" />
            <text x="160" y="45" textAnchor="middle" fill="#f6ad3c" fontSize="8" fontWeight="bold">講師</text>
            <circle cx="160" cy="145" r="12" fill="#f6ad3c" opacity="0.6" />
            <text x="160" y="165" textAnchor="middle" fill="#f6ad3c" fontSize="8" opacity="0.8">生徒</text>
          </>
        )}
        {type === "question" && (
          <>
            <text x="160" y="25" textAnchor="middle" fill="#4caf50" fontSize="12" fontWeight="bold">質問ルーム</text>
            {[{ x: 80, y: 60 }, { x: 180, y: 50 }, { x: 130, y: 100 }, { x: 240, y: 90 }].map((pos, i) => (
              <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <rect x="-20" y="10" width="40" height="25" rx="4" fill="#4caf5015" />
                <circle cx="0" cy="3" r="8" fill="#4caf50" opacity={0.4 + i * 0.15} />
                {i === 0 && (
                  <>
                    <circle cx="15" cy="-8" r="7" fill="white" stroke="#4caf50" strokeWidth="1" />
                    <text x="15" y="-4" textAnchor="middle" fill="#4caf50" fontSize="8" fontWeight="bold">?</text>
                  </>
                )}
              </g>
            ))}
            <circle cx="130" cy="140" r="10" fill="#4caf50" />
            <text x="130" y="158" textAnchor="middle" fill="#4caf50" fontSize="7">チューター</text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ============================================
   Section Title Component
   ============================================ */

function SectionTitle({ children, white = false }: { children: React.ReactNode; white?: boolean }) {
  return (
    <>
      <h2 className={`text-2xl font-bold sm:text-3xl lg:text-4xl ${white ? "text-white" : ""}`}>
        {children}
      </h2>
      <div className="mx-auto mt-5 flex items-center justify-center gap-3">
        <div className={`h-[2px] w-12 rounded-full ${white ? "bg-white/20" : "bg-[#1b99a4]/30"}`} />
        <div className={`h-1.5 w-1.5 rounded-full ${white ? "bg-white/50" : "bg-[#1b99a4]"}`} />
        <div className={`h-[2px] w-24 rounded-full ${white ? "bg-white/40" : "bg-[#1b99a4]"}`} />
        <div className={`h-1.5 w-1.5 rounded-full ${white ? "bg-white/50" : "bg-[#1b99a4]"}`} />
        <div className={`h-[2px] w-12 rounded-full ${white ? "bg-white/20" : "bg-[#1b99a4]/30"}`} />
      </div>
    </>
  );
}

/* ============================================
   Main Page Component
   ============================================ */

export default function HomePage() {
  const observe = useScrollAnimation();

  return (
    <>
      <Header />
      <main>
        {/* ===== 1. Hero Section - 2 column with image ===== */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-teal-800 via-cyan-700 to-teal-900">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="animate-float absolute top-[10%] left-[8%] w-20 h-20 rounded-full border-2 border-white/10 bg-white/5" />
            <div className="animate-float-slow absolute bottom-[25%] right-[12%] w-32 h-32 rounded-full border-2 border-white/8 bg-white/[0.03]" />
            <div className="animate-float-reverse absolute top-[18%] right-[15%] w-0 h-0" style={{ borderLeft: "24px solid transparent", borderRight: "24px solid transparent", borderBottom: "42px solid rgba(255,255,255,0.07)" }} />
            <div className="animate-float-slow absolute top-[55%] left-[5%] w-10 h-10 rounded-full bg-white/[0.06]" />
            <div className="animate-float absolute top-[5%] left-[45%] w-14 h-14 rounded-full border border-white/[0.08]" />
            <div className="animate-float-slow absolute top-[30%] right-[30%] w-48 h-48 rounded-full border border-white/[0.04]" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.06)_0%,_transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:py-32 lg:py-40 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="text-center lg:text-left">
                <p ref={observe} className="scroll-animate mb-6 text-sm font-medium tracking-[0.25em] uppercase text-amber-200/90">Shukutoku Advance</p>
                <h1 ref={observe} className="scroll-animate text-3xl font-black leading-tight sm:text-4xl lg:text-5xl xl:text-6xl text-white" style={{ animationDelay: "150ms" }}>
                  淑徳高校の生徒のための<br /><span className="text-[#f6ad3c]">自ら取り組むオリジナル授業</span>
                </h1>
                <p ref={observe} className="scroll-animate mt-8 max-w-xl text-lg leading-relaxed text-teal-100/90 sm:text-xl mx-auto lg:mx-0" style={{ animationDelay: "300ms" }}>
                  プロの予備校講師が学校内で授業を実施。<br className="hidden sm:block" />移動時間ゼロ、圧倒的低価格で質の高い受験対策を。
                </p>
                <div ref={observe} className="scroll-animate mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center" style={{ animationDelay: "450ms" }}>
                  <Button asChild size="lg" className="bg-[#f6ad3c] text-white hover:bg-[#e89a20] font-bold text-base px-10 py-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                    <Link href="/apply">お申し込みはこちら<ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-base px-10 py-6 rounded-xl backdrop-blur-sm transition-all duration-300">
                    <Link href="/auth/student-login">受講生ログイン</Link>
                  </Button>
                </div>
              </div>
              <div ref={observe} className="scroll-animate hidden lg:block" style={{ animationDelay: "500ms" }}>
                <HeroMockImage />
              </div>
            </div>
            <div className="mt-12 flex justify-center animate-bounce lg:mt-16">
              <ChevronDown className="h-8 w-8 text-white/40" />
            </div>
          </div>
          <div className="wave-divider"><svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z" fill="white" /></svg></div>
        </section>

        {/* ===== 2. About Section with image ===== */}
        <section id="about" className="bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <div ref={observe} className="scroll-animate text-center">
              <SectionTitle>学校内の予備校で<br className="sm:hidden" /><span className="text-[#1b99a4]">自ら取り組む</span>オリジナル授業</SectionTitle>
            </div>

            <div className="mt-14 grid lg:grid-cols-2 gap-12 items-center">
              <div ref={observe} className="scroll-animate" style={{ animationDelay: "200ms" }}>
                <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-teal-50 to-white aspect-[4/3]">
                  <svg viewBox="0 0 400 300" className="w-full h-full">
                    <rect width="400" height="300" fill="#f8fcfc" />
                    <rect x="50" y="80" width="300" height="180" rx="8" fill="white" stroke="#1b99a4" strokeWidth="2" />
                    <rect x="50" y="80" width="300" height="30" rx="8" fill="#1b99a4" opacity="0.1" />
                    {[0, 1, 2, 3].map((i) => (
                      <g key={i}>
                        <rect x={80 + i * 70} y={90} width="30" height="15" rx="2" fill="#1b99a4" opacity="0.15" />
                        <rect x={80 + i * 70} y={130} width="30" height="25" rx="2" fill="#e0f4f8" />
                        <rect x={80 + i * 70} y={170} width="30" height="25" rx="2" fill="#e0f4f8" />
                        <rect x={80 + i * 70} y={210} width="30" height="25" rx="2" fill="#e0f4f8" />
                      </g>
                    ))}
                    <rect x="175" y="220" width="50" height="40" rx="3" fill="#1b99a4" opacity="0.3" />
                    <rect x="130" y="55" width="140" height="22" rx="4" fill="white" stroke="#1b99a4" strokeWidth="1.5" />
                    <text x="200" y="70" textAnchor="middle" fill="#1b99a4" fontSize="10" fontWeight="bold">淑徳アドバンス</text>
                    <circle cx="30" cy="230" r="20" fill="#4caf50" opacity="0.3" />
                    <rect x="27" y="245" width="6" height="15" rx="2" fill="#8B4513" opacity="0.3" />
                    <circle cx="380" cy="220" r="25" fill="#4caf50" opacity="0.25" />
                    <rect x="377" y="240" width="6" height="20" rx="2" fill="#8B4513" opacity="0.3" />
                  </svg>
                </div>
              </div>
              <div ref={observe} className="scroll-animate" style={{ animationDelay: "300ms" }}>
                <h3 className="text-xl font-bold text-slate-800 mb-4">放課後の教室が、あなたの予備校に。</h3>
                <p className="text-base leading-[2] text-muted-foreground">
                  淑徳アドバンスは、予備校のプロ講師が学校内で授業を行う「学校内予備校」です。
                  学校の補習授業とは異なり、受験に特化した集団授業・個別指導を、レベルに合わせたカリキュラムで提供しています。
                </p>
                <p className="mt-4 text-base leading-[2] text-muted-foreground">移動時間がゼロだから、放課後の時間を最大限に活用できます。</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { icon: Target, label: "受験特化カリキュラム" },
                    { icon: Calendar, label: "放課後すぐ受講可能" },
                    { icon: CheckCircle, label: "プロ講師による指導" },
                    { icon: Users, label: "少人数制クラス" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#1b99a4]/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-[#1b99a4]" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3. 4つのメリット ===== */}
        <section id="merit" className="py-24 lg:py-32" style={{ backgroundColor: "#fffaf3" }}>
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center" ref={observe}>
              <div className="scroll-animate"><SectionTitle>淑徳アドバンスの <span className="text-[#1b99a4]">4つのメリット</span></SectionTitle></div>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {merits.map((merit, i) => (
                <div key={i} ref={observe} className="scroll-animate" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                  <Card className="hover-lift border-0 bg-white shadow-md h-full">
                    <CardContent className="pt-8 pb-6 px-6 text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1b99a4]/10 ring-4 ring-[#1b99a4]/5">
                        <merit.icon className="h-8 w-8 text-[#1b99a4]" />
                      </div>
                      <h3 className="mb-3 text-lg font-bold">{merit.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{merit.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 4. 3つの学び方 with mock images ===== */}
        <section id="courses" className="bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center" ref={observe}>
              <div className="scroll-animate"><SectionTitle><span className="text-[#1b99a4]">3つの学び方</span>で確実に力をつける</SectionTitle></div>
            </div>
            <div className="mt-14 grid gap-10 lg:grid-cols-3">
              {courseTypes.map((course, i) => (
                <div key={i} ref={observe} className="scroll-animate" style={{ animationDelay: `${(i + 1) * 150}ms` }}>
                  <Card className="group h-full border-0 shadow-md bg-white overflow-hidden transition-all duration-300 hover:shadow-xl">
                    <CourseTypeMockImage type={i === 0 ? "group" : i === 1 ? "individual" : "question"} />
                    <CardContent className="pt-6 pb-6 px-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${course.color}15` }}>
                          <course.icon className="h-5 w-5" style={{ color: course.color }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{course.title}</h3>
                          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{course.subtitle}</p>
                        </div>
                      </div>
                      <p className="mb-2 text-muted-foreground leading-relaxed text-sm">{course.description}</p>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">{course.detail}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            <div ref={observe} className="scroll-animate mt-12 text-center" style={{ animationDelay: "500ms" }}>
              <Button asChild variant="outline" size="lg" className="border-[#1b99a4]/30 text-[#1b99a4] hover:bg-[#1b99a4]/5 hover:border-[#1b99a4]/50 rounded-xl px-8 transition-all duration-300">
                <Link href="/courses" className="gap-2">講座紹介を見る <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ===== 5. Testimonials ===== */}
        <section className="py-24 lg:py-32" style={{ backgroundColor: "#fffaf3" }}>
          <div className="mx-auto max-w-6xl px-4">
            <div ref={observe} className="scroll-animate text-center"><SectionTitle>受講生の<span className="text-[#1b99a4]">声</span></SectionTitle></div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <div key={i} ref={observe} className="scroll-animate" style={{ animationDelay: `${(i + 1) * 150}ms` }}>
                  <Card className="h-full border-0 shadow-md bg-white">
                    <CardContent className="pt-6 pb-6 px-6">
                      <div className="flex gap-0.5 mb-4">
                        {[...Array(5)].map((_, j) => (<Star key={j} className="w-4 h-4 fill-[#f6ad3c] text-[#f6ad3c]" />))}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground mb-6">&ldquo;{t.text}&rdquo;</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1b99a4]/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#1b99a4]">{t.initial}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{t.initial}さん</p>
                          <p className="text-xs text-muted-foreground">{t.grade}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 6. Stats ===== */}
        <section className="relative bg-gradient-to-br from-teal-800 via-[#1b99a4] to-teal-700 py-20 lg:py-28 text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[10%] left-[5%] w-40 h-40 rounded-full bg-white/[0.03] animate-float-slow" />
            <div className="absolute bottom-[10%] right-[8%] w-24 h-24 rounded-full bg-white/[0.05] animate-float" />
          </div>
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <div className="text-center mb-16" ref={observe}><div className="scroll-animate"><SectionTitle white>数字で見る淑徳アドバンス</SectionTitle></div></div>
            <div className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-8">
              {stats.map((stat, i) => (<StatCard key={i} value={stat.value} label={stat.label} delay={i * 200} />))}
            </div>
          </div>
        </section>

        {/* ===== 7. CTA ===== */}
        <section className="relative bg-gradient-to-br from-[#1b99a4] via-teal-700 to-indigo-800 py-20 lg:py-28 text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[20%] right-[10%] w-32 h-32 rounded-full bg-white/[0.04] animate-float" />
            <div className="absolute bottom-[20%] left-[8%] w-20 h-20 rounded-full bg-white/[0.03] animate-float-reverse" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h2 ref={observe} className="scroll-animate text-2xl font-bold sm:text-3xl lg:text-4xl text-white">まずはお気軽にお問い合わせください</h2>
            <p ref={observe} className="scroll-animate mx-auto mt-6 max-w-xl text-lg text-white/80 leading-relaxed" style={{ animationDelay: "150ms" }}>
              講座の内容や料金、受講に関するご質問など、<br className="hidden sm:block" />お気軽にお問い合わせください。
            </p>
            <div ref={observe} className="scroll-animate mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: "300ms" }}>
              <Button asChild size="lg" className="bg-[#f6ad3c] text-white hover:bg-[#e89a20] font-bold text-base px-10 py-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                <Link href="/apply">お申し込みはこちら<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-base px-10 py-6 rounded-xl backdrop-blur-sm transition-all duration-300">
                <Link href="/contact" className="gap-2"><Phone className="h-5 w-5 mr-2" /> お問い合わせ</Link>
              </Button>
            </div>
            <p ref={observe} className="scroll-animate mt-8 text-base text-white/70" style={{ animationDelay: "450ms" }}>
              お電話でのお問い合わせ:{" "}
              <a href="tel:0339697411" className="text-white font-bold underline underline-offset-4 decoration-white/40 hover:decoration-white/80 transition-colors">03-3969-7411</a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
