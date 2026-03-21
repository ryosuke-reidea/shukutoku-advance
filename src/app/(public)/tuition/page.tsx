import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TuitionInfo } from "@/lib/types/database";

export const revalidate = 60;

export const metadata = {
  title: "授業料 | 淑徳アドバンス",
  description: "淑徳アドバンスの授業料・料金体系のご案内です。",
};

export default async function TuitionPage() {
  const supabase = await createServerSupabaseClient();

  const { data: tuitionData } = await supabase
    .from("tuition_info")
    .select("*")
    .order("display_order");

  const rows = (tuitionData ?? []) as TuitionInfo[];

  const groupPerCourse = rows.find((r) => r.course_type === "group_per_course");
  const flatRates = rows.filter((r) => r.course_type === "flat_rate");
  const individualItems = rows.filter((r) =>
    r.course_type.startsWith("individual_")
  );
  const additionalItems = rows.filter((r) => r.course_type === "additional");

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
      {groupPerCourse && (
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
                    {groupPerCourse.label}
                  </CardTitle>
                  <CardDescription>
                    複数講座の受講で定額制の適用があります
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 pb-8">
                  <div
                    className="text-3xl sm:text-5xl font-bold"
                    style={{ color: "#1b99a4" }}
                  >
                    ¥{groupPerCourse.price.toLocaleString()}
                    <span className="text-base font-normal text-muted-foreground">
                      /{groupPerCourse.unit}
                    </span>
                  </div>
                  {groupPerCourse.notes && (
                    <Badge
                      className="text-sm px-4 py-1 border-none text-white"
                      style={{ backgroundColor: "#f6ad3c" }}
                    >
                      {groupPerCourse.notes}
                    </Badge>
                  )}
                  {groupPerCourse.description && (
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {groupPerCourse.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 定額制プラン */}
            {flatRates.length > 0 && (
              <div className="max-w-4xl mx-auto mt-12">
                <div className="text-center mb-8 animate-fade-in-up">
                  <Badge
                    className="text-base px-6 py-2 border-none text-white shadow-lg"
                    style={{ backgroundColor: "#f6ad3c" }}
                  >
                    お得な定額制プラン
                  </Badge>
                  <p className="text-muted-foreground mt-3 text-sm">
                    一定の講座数以上を受講すると、何講座受講しても会期定額になります
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
                  {flatRates.map((info, index) => {
                    const color = info.color || "#1b99a4";
                    return (
                      <div
                        key={info.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${(index + 1) * 150}ms` }}
                      >
                        <Card
                          className="hover-lift border-2 overflow-hidden h-full"
                          style={{ borderColor: color }}
                        >
                          <div
                            className="h-2"
                            style={{ backgroundColor: color }}
                          />
                          <CardHeader className="text-center pb-2">
                            <div
                              className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center"
                              style={{ backgroundColor: `${color}15` }}
                            >
                              <span
                                className="text-2xl font-black"
                                style={{ color }}
                              >
                                {info.label}
                              </span>
                            </div>
                            <CardTitle className="text-base font-bold">
                              {info.min_courses}講座以上で定額
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-center space-y-3 pb-6">
                            <div
                              className="text-3xl font-bold"
                              style={{ color }}
                            >
                              ¥{info.price.toLocaleString()}
                              <span className="text-sm font-normal text-muted-foreground">
                                /{info.unit}
                              </span>
                            </div>
                            {info.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {info.description}
                              </p>
                            )}
                            <div
                              className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {info.min_courses}講座目以降 追加料金なし
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mt-6 animate-fade-in-up">
                  <p className="text-xs text-muted-foreground">
                    ※ 上記の講座数以上を受講される場合、追加の講座は無料で受講いただけます。
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2 mt-8">
              <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: "#1b99a4" }} />
              <div className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: "#1b99a4" }} />
              <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: "#1b99a4" }} />
            </div>
          </div>
        </section>
      )}

      {/* Individual Tutoring Section */}
      {individualItems.length > 0 && (
        <section className="py-16 lg:py-20" style={{ backgroundColor: "#e0f4f8" }}>
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
              {individualItems.map((plan, index) => {
                const isRecommended = index === 0;
                return (
                  <div
                    key={plan.id}
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
                      {isRecommended && (
                        <div
                          className="absolute top-0 left-0 right-0 h-1.5"
                          style={{
                            background: "linear-gradient(90deg, #f6ad3c, #f8c06a)",
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
                            backgroundColor: isRecommended ? "#fff5e0" : "#e0f4f8",
                          }}
                        >
                          <span
                            className="text-lg font-bold"
                            style={{
                              color: isRecommended ? "#e89a20" : "#1b99a4",
                            }}
                          >
                            {plan.notes || ""}
                          </span>
                        </div>
                        <CardTitle className="text-lg font-bold">
                          {plan.label}
                        </CardTitle>
                        <CardDescription>{plan.notes || ""}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-4 pb-8">
                        <div className="text-3xl font-bold" style={{ color: "#1b99a4" }}>
                          ¥{plan.price.toLocaleString()}
                          <span className="text-base font-normal text-muted-foreground">
                            /{plan.unit}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {plan.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Additional Info Section */}
      {additionalItems.length > 0 && (
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
              {additionalItems.map((info) => (
                <Card
                  key={info.id}
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
                          {info.label}
                        </CardTitle>
                      </div>
                      <Badge
                        className="text-lg font-bold px-5 py-1.5 text-white border-none w-fit"
                        style={{ backgroundColor: "#1b99a4" }}
                      >
                        {info.unit === "無料" ? "無料" : `¥${info.price.toLocaleString()}`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {info.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {info.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
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
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#1b99a4" }} />
                    表示の料金はすべて税込です。
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#1b99a4" }} />
                    教材費は別途必要となる場合があります。詳しくはお問い合わせください。
                  </li>
                  {flatRates.length > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#1b99a4" }} />
                      定額制は学年ごとに適用される講座数が異なります（
                      {flatRates.map((fr) => `${fr.label}: ${fr.min_courses}講座以上`).join("、")}
                      ）。
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#1b99a4" }} />
                    料金は変更になる場合があります。最新の情報はお問い合わせください。
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-2 mt-10">
            <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: "#1b99a4" }} />
            <div className="w-3 h-3 rounded-full opacity-50" style={{ backgroundColor: "#1b99a4" }} />
            <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: "#1b99a4" }} />
          </div>
        </div>
      </section>
    </div>
  );
}
