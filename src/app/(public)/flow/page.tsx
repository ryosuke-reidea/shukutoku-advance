import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "申し込みの流れ | 淑徳アドバンス",
  description: "淑徳アドバンスへの申し込み手順をご案内します。",
};

const STEPS = [
  {
    number: 1,
    title: "講座選択",
    description: "受講したい講座を選びます",
    details:
      "講座紹介ページから、ご希望のカテゴリ・科目の講座をお選びください。時間割や教室割も確認できます。複数講座の同時申し込みも可能です。",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
        <path d="m9 9.5 2 2 4-4" />
      </svg>
    ),
  },
  {
    number: 2,
    title: "ログイン",
    description: "Googleアカウントでログインします",
    details:
      "Googleアカウントを使ってログインしてください。初めての方は自動的にアカウントが作成されます。保護者の方のアカウントでのログインをお願いいたします。",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" x2="3" y1="12" y2="12" />
      </svg>
    ),
  },
  {
    number: 3,
    title: "支払い方法選択",
    description: "お支払い方法を選択します",
    details:
      "クレジットカード、銀行振込など、ご希望のお支払い方法をお選びください。定額制プランをご希望の場合は、こちらで設定できます。",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    number: 4,
    title: "申込確認",
    description: "申し込み内容を確認します",
    details:
      "選択した講座、お支払い方法、ご登録情報をご確認ください。内容に間違いがなければ、申し込みを確定してください。",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    number: 5,
    title: "申込完了",
    description: "申し込みが完了します",
    details:
      "申し込みが完了すると、確認メールが送信されます。マイページから申し込み状況をいつでも確認できます。授業開始日までにご準備ください。",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function FlowPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fffaf3" }}>
      {/* Page Header */}
      <section className="page-header">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            申し込みの流れ
          </h1>
          <div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ backgroundColor: "#1b99a4" }}
          />
          <p className="text-muted-foreground text-lg">
            5つのステップで簡単にお申し込みいただけます
          </p>
        </div>
      </section>

      {/* Timeline Steps */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className="relative flex gap-6 sm:gap-8 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Timeline Left Column: Line + Circle */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Step Number Circle */}
                  <div
                    className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: "#1b99a4" }}
                  >
                    {step.number}
                  </div>
                  {/* Connecting Line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className="w-0.5 flex-1 min-h-[2rem]"
                      style={{
                        background:
                          "linear-gradient(180deg, #1b99a4, #21b8c5, #e0f4f8)",
                      }}
                    />
                  )}
                </div>

                {/* Step Card */}
                <div className="flex-1 pb-10">
                  <Card
                    className="hover-lift overflow-hidden border-l-0"
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "white" : "#fffaf3",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {/* Icon in teal circle */}
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#e0f4f8" }}
                        >
                          <span style={{ color: "#1b99a4" }}>{step.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <h3 className="text-xl font-bold tracking-tight">
                            {step.title}
                          </h3>
                          <p
                            className="text-base font-medium"
                            style={{ color: "#1b99a4" }}
                          >
                            {step.description}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.details}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-16 lg:py-20"
        style={{
          background:
            "linear-gradient(135deg, #e0f4f8 0%, #fffaf3 50%, #e0f4f8 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in-up">
            {/* Decorative element */}
            <div className="flex justify-center gap-2">
              <div
                className="w-2 h-2 rounded-full opacity-40"
                style={{ backgroundColor: "#1b99a4" }}
              />
              <div
                className="w-3 h-3 rounded-full opacity-60"
                style={{ backgroundColor: "#1b99a4" }}
              />
              <div
                className="w-2 h-2 rounded-full opacity-40"
                style={{ backgroundColor: "#1b99a4" }}
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                さっそく申し込みを始めましょう
              </h2>
              <p className="text-muted-foreground text-lg">
                講座を選んで、簡単なステップでお申し込みいただけます
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="min-w-[200px] text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: "#1b99a4" }}
              >
                <Link href="/apply">申し込みへ進む</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-w-[200px] hover-lift"
                style={{
                  borderColor: "#1b99a4",
                  color: "#1b99a4",
                }}
              >
                <Link href="/courses">講座を見る</Link>
              </Button>
            </div>

            {/* Bottom decorative dots */}
            <div className="flex justify-center gap-2 pt-4">
              <div
                className="w-2 h-2 rounded-full opacity-30"
                style={{ backgroundColor: "#f6ad3c" }}
              />
              <div
                className="w-2 h-2 rounded-full opacity-50"
                style={{ backgroundColor: "#1b99a4" }}
              />
              <div
                className="w-2 h-2 rounded-full opacity-30"
                style={{ backgroundColor: "#f6ad3c" }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
