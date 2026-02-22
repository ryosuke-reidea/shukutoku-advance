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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const merits = [
  {
    icon: Shield,
    title: "学校内なので安心・安全",
    description:
      "授業が行われるのは学校内。保護者の方も安心してお子様を預けることができます。",
  },
  {
    icon: Clock,
    title: "移動時間ゼロ。学習時間を確保",
    description:
      "学校内で授業が受けられるため、予備校への移動時間がゼロ。その分を学習に充てられます。",
  },
  {
    icon: BookOpen,
    title: "授業内容とリンク、より深い理解",
    description:
      "学校の授業内容と連携したカリキュラムで、より深い理解と確実な学力向上を実現します。",
  },
  {
    icon: Coins,
    title: "進学予備校に比べ圧倒的な低価格",
    description:
      "一般的な予備校と比較して圧倒的な低価格。質の高い授業を家計にやさしい料金で受講できます。",
  },
];

const courseTypes = [
  {
    icon: Users,
    title: "集団授業",
    description: "80分の集団授業。レベル別カリキュラムで全科目に対応。",
    detail: "早慶国立クラス・GMARCHクラスなど、志望校に合わせた講座を用意。",
  },
  {
    icon: GraduationCap,
    title: "個別指導",
    description: "1対1、1対2、1対3の個別指導。医学部プレミアムコースも。",
    detail: "淑徳OB・OGの大学生チューターが丁寧に指導します。",
  },
  {
    icon: BookOpen,
    title: "質問ルーム",
    description: "利用料無料。淑徳OB・OGチューターに自由に質問できます。",
    detail: "平日 16:30-20:00 / 土曜 13:30-17:30",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32 lg:py-40">
            <div className="text-center">
              <p className="mb-4 text-sm font-medium tracking-widest uppercase text-blue-200">
                Shukutoku Advance
              </p>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                淑徳高校の生徒のための
                <br />
                <span className="text-yellow-300">
                  自ら取り組むオリジナル授業
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
                プロの予備校講師が学校内で授業を実施。
                <br className="hidden sm:block" />
                移動時間ゼロ、圧倒的低価格で質の高い受験対策を。
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-bold text-base px-8"
                >
                  <Link href="/apply">お申し込みはこちら</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/10 text-base px-8"
                >
                  <Link href="/auth/student-login">受講生ログイン</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* About Section */}
        <section id="about" className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                学校内の予備校で
                <br className="sm:hidden" />
                <span className="text-primary">自ら取り組む</span>
                オリジナル授業
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded bg-primary" />
              <p className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                淑徳アドバンスは、予備校のプロ講師が学校内で授業を行う「学校内予備校」です。
                学校の補習授業とは異なり、受験に特化した集団授業・個別指導を、
                レベルに合わせたカリキュラムで提供しています。
              </p>
            </div>
          </div>
        </section>

        {/* Merits Section */}
        <section id="merit" className="bg-slate-50 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">
                淑徳アドバンスの{" "}
                <span className="text-primary">4つのメリット</span>
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded bg-primary" />
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {merits.map((merit, i) => (
                <Card
                  key={i}
                  className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="pt-8 pb-6 px-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <merit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mb-3 text-lg font-bold">{merit.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {merit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Course Types Section */}
        <section id="courses" className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">
                <span className="text-primary">3つの学び方</span>
                で確実に力をつける
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded bg-primary" />
            </div>
            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {courseTypes.map((course, i) => (
                <Card
                  key={i}
                  className="group border-2 hover:border-primary/30 transition-colors"
                >
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <course.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">{course.title}</h3>
                    <p className="mb-3 text-muted-foreground">
                      {course.description}
                    </p>
                    <p className="text-sm text-muted-foreground/80">
                      {course.detail}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/courses" className="gap-2">
                  講座紹介を見る <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-800 to-indigo-900 py-16 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              まずはお気軽にお問い合わせください
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100">
              講座の内容や料金、受講に関するご質問など、お気軽にお問い合わせください。
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-bold px-8"
              >
                <Link href="/apply">お申し込みはこちら</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/40 text-white hover:bg-white/10 px-8"
              >
                <Link href="/contact" className="gap-2">
                  <Phone className="h-4 w-4" /> お問い合わせ
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              お電話でのお問い合わせ:{" "}
              <a href="tel:0339697411" className="underline font-medium">
                03-3969-7411
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
