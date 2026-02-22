import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "授業料 | 淑徳アドバンス",
  description: "淑徳アドバンスの授業料・料金体系のご案内です。",
};

const GROUP_PRICING = {
  perCourse: "¥11,000",
  note: "定額制あり",
};

const INDIVIDUAL_PRICING = [
  {
    ratio: "1対1",
    label: "マンツーマン",
    price: "¥24,000",
    description: "講師1人に対して生徒1人。完全個別対応で最大限の効果を発揮します。",
  },
  {
    ratio: "1対2",
    label: "セミ個別",
    price: "¥19,000",
    description:
      "講師1人に対して生徒2人。個別対応を保ちながら、コストを抑えた形式です。",
  },
  {
    ratio: "1対3",
    label: "少人数個別",
    price: "¥15,000",
    description:
      "講師1人に対して生徒3人。個別指導の良さを残しつつ、お手頃な料金です。",
  },
];

const ADDITIONAL_INFO = [
  {
    title: "自習室",
    price: "無料",
    description: "受講生は自習室を無料でご利用いただけます。静かな環境で集中して学習できます。",
  },
];

export default async function TuitionPage() {
  const supabase = await createServerSupabaseClient();

  const { data: tuitionInfo } = await supabase
    .from("tuition_info")
    .select("*")
    .order("sort_order");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fffaf3" }}>
      {/* Page Header */}
      <section className="page-header">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            授業料
          </h1>
          <div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ backgroundColor: "#1b99a4" }}
          />
          <p className="text-muted-foreground text-lg">
            淑徳アドバンスの料金体系をご案内します
          </p>
        </div>
      </section>

      {/* Group Classes Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#1b99a4]/40" />
              <h2 className="text-2xl font-bold tracking-tight">集団授業</h2>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#1b99a4]/40" />
            </div>
          </div>

          <div className="max-w-lg mx-auto animate-fade-in-up animation-delay-200">
            <Card
              className="border-2 overflow-hidden hover-lift"
              style={{ borderColor: "#1b99a4" }}
            >
              {/* Decorative top gradient */}
              <div
                className="h-2"
                style={{
                  background:
                    "linear-gradient(90deg, #1b99a4 0%, #21b8c5 50%, #f6ad3c 100%)",
                }}
              />
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#e0f4f8" }}
                  >
                    <svg
                      className="w-7 h-7"
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
                  </div>
                </div>
                <CardTitle className="text-lg font-bold">
                  集団授業（1講座あたり）
                </CardTitle>
                <CardDescription>
                  複数講座の受講で定額制の適用があります
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4 pb-8">
                <div className="text-3xl sm:text-5xl font-bold" style={{ color: "#1b99a4" }}>
                  {GROUP_PRICING.perCourse}
                  <span className="text-base font-normal text-muted-foreground">
                    /月
                  </span>
                </div>
                <Badge
                  className="text-sm px-4 py-1 border-none text-white"
                  style={{ backgroundColor: "#f6ad3c" }}
                >
                  {GROUP_PRICING.note}
                </Badge>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  1講座あたりの月額料金です。複数講座を受講される場合は、定額制プランをご利用いただけます。
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Decorative dots */}
          <div className="flex justify-center gap-2 mt-8">
            <div
              className="w-2 h-2 rounded-full opacity-30"
              style={{ backgroundColor: "#1b99a4" }}
            />
            <div
              className="w-2 h-2 rounded-full opacity-50"
              style={{ backgroundColor: "#1b99a4" }}
            />
            <div
              className="w-2 h-2 rounded-full opacity-30"
              style={{ backgroundColor: "#1b99a4" }}
            />
          </div>
        </div>
      </section>

      {/* Individual Tutoring Section */}
      <section
        className="py-16 lg:py-20"
        style={{ backgroundColor: "#e0f4f8" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#1b99a4]/40" />
              <h2 className="text-2xl font-bold tracking-tight">個別指導</h2>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#1b99a4]/40" />
            </div>
            <p className="text-muted-foreground mt-2">
              お子様に合った指導スタイルをお選びください
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {INDIVIDUAL_PRICING.map((plan, index) => {
              const isRecommended = index === 0;
              return (
                <div
                  key={plan.ratio}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${(index + 1) * 150}ms` }}
                >
                  <Card
                    className={`hover-lift relative overflow-hidden h-full ${
                      isRecommended ? "border-2 shadow-lg" : "border bg-white"
                    }`}
                    style={{
                      borderColor: isRecommended ? "#f6ad3c" : undefined,
                    }}
                  >
                    {/* Recommended badge ribbon */}
                    {isRecommended && (
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{
                          background:
                            "linear-gradient(90deg, #f6ad3c, #f8c06a)",
                        }}
                      />
                    )}
                    <CardHeader className="text-center pb-2">
                      {isRecommended && (
                        <Badge
                          className="w-fit mx-auto mb-3 text-white border-none px-4 py-1"
                          style={{ backgroundColor: "#f6ad3c" }}
                        >
                          おすすめ
                        </Badge>
                      )}
                      <div
                        className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{
                          backgroundColor: isRecommended
                            ? "#fff5e0"
                            : "#e0f4f8",
                        }}
                      >
                        <span
                          className="text-lg font-bold"
                          style={{
                            color: isRecommended ? "#e89a20" : "#1b99a4",
                          }}
                        >
                          {plan.ratio}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold">
                        {plan.label}
                      </CardTitle>
                      <CardDescription>{plan.ratio}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4 pb-8">
                      <div
                        className="text-3xl font-bold"
                        style={{ color: "#1b99a4" }}
                      >
                        {plan.price}
                        <span className="text-base font-normal text-muted-foreground">
                          /月
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {plan.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#1b99a4]/40" />
              <h2 className="text-2xl font-bold tracking-tight">その他</h2>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#1b99a4]/40" />
            </div>
          </div>

          <div className="max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            {ADDITIONAL_INFO.map((info) => (
              <Card
                key={info.title}
                className="hover-lift border-l-4 overflow-hidden"
                style={{ borderLeftColor: "#1b99a4" }}
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#e0f4f8" }}
                      >
                        <svg
                          className="w-5 h-5"
                          style={{ color: "#1b99a4" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                        </svg>
                      </div>
                      <CardTitle className="text-lg font-bold">
                        {info.title}
                      </CardTitle>
                    </div>
                    <Badge
                      className="text-lg font-bold px-5 py-1.5 text-white border-none w-fit"
                      style={{ backgroundColor: "#1b99a4" }}
                    >
                      {info.price}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {info.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Tuition Info from DB */}
      {tuitionInfo && tuitionInfo.length > 0 && (
        <section
          className="py-16 lg:py-20"
          style={{ backgroundColor: "#e0f4f8" }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#1b99a4]/40" />
                <h2 className="text-2xl font-bold tracking-tight">
                  料金詳細
                </h2>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#1b99a4]/40" />
              </div>
            </div>

            <div className="max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              <Card className="overflow-hidden shadow-sm hover-lift">
                <div
                  className="h-1"
                  style={{
                    background:
                      "linear-gradient(90deg, #1b99a4, #21b8c5, #f6ad3c)",
                  }}
                />
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="font-bold text-white"
                          style={{ backgroundColor: "#1b99a4" }}
                        >
                          項目
                        </TableHead>
                        <TableHead
                          className="font-bold text-white"
                          style={{ backgroundColor: "#1b99a4" }}
                        >
                          内容
                        </TableHead>
                        <TableHead
                          className="text-right font-bold text-white"
                          style={{ backgroundColor: "#1b99a4" }}
                        >
                          料金
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tuitionInfo.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="transition-colors hover:bg-[#e0f4f8]/30"
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? "transparent" : "#fffaf3",
                          }}
                        >
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.description ?? "-"}
                          </TableCell>
                          <TableCell
                            className="text-right font-bold"
                            style={{ color: "#1b99a4" }}
                          >
                            {item.price != null
                              ? `¥${item.price.toLocaleString()}`
                              : item.price_text ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Notes Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <Card
              className="border-l-4 overflow-hidden"
              style={{
                borderLeftColor: "#f6ad3c",
                backgroundColor: "#fffaf3",
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#fff5e0" }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: "#f6ad3c" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg">ご注意事項</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: "#1b99a4" }}
                    />
                    表示の料金はすべて税込です。
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: "#1b99a4" }}
                    />
                    教材費は別途必要となる場合があります。詳しくはお問い合わせください。
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: "#1b99a4" }}
                    />
                    定額制プランの適用条件については、お電話またはお問い合わせフォームよりご確認ください。
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: "#1b99a4" }}
                    />
                    料金は変更になる場合があります。最新の情報はお問い合わせください。
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Decorative bottom dots */}
          <div className="flex justify-center gap-2 mt-10">
            <div
              className="w-2 h-2 rounded-full opacity-30"
              style={{ backgroundColor: "#1b99a4" }}
            />
            <div
              className="w-3 h-3 rounded-full opacity-50"
              style={{ backgroundColor: "#1b99a4" }}
            />
            <div
              className="w-2 h-2 rounded-full opacity-30"
              style={{ backgroundColor: "#1b99a4" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
