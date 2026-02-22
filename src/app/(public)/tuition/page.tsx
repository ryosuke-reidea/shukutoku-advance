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
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">授業料</h1>
        <p className="text-muted-foreground">
          淑徳アドバンスの料金体系をご案内します
        </p>
      </div>

      {/* Group Classes Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">集団授業</h2>
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">集団授業（1講座あたり）</CardTitle>
              <CardDescription>
                複数講座の受講で定額制の適用があります
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="text-4xl font-bold text-primary">
                {GROUP_PRICING.perCourse}
                <span className="text-base font-normal text-muted-foreground">
                  /月
                </span>
              </div>
              <Badge variant="secondary" className="text-sm">
                {GROUP_PRICING.note}
              </Badge>
              <p className="text-sm text-muted-foreground">
                1講座あたりの月額料金です。複数講座を受講される場合は、定額制プランをご利用いただけます。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Individual Tutoring Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">個別指導</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {INDIVIDUAL_PRICING.map((plan, index) => (
            <Card
              key={plan.ratio}
              className={
                index === 0 ? "border-2 border-primary shadow-lg" : ""
              }
            >
              <CardHeader className="text-center">
                {index === 0 && (
                  <Badge className="w-fit mx-auto mb-2">おすすめ</Badge>
                )}
                <CardTitle className="text-lg">{plan.label}</CardTitle>
                <CardDescription>{plan.ratio}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <div className="text-3xl font-bold text-primary">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">
                    /月
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">その他</h2>
        <div className="max-w-2xl mx-auto">
          {ADDITIONAL_INFO.map((info) => (
            <Card key={info.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-lg font-bold px-4 py-1"
                  >
                    {info.price}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {info.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dynamic Tuition Info from DB */}
      {tuitionInfo && tuitionInfo.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">料金詳細</h2>
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">項目</TableHead>
                      <TableHead className="font-semibold">内容</TableHead>
                      <TableHead className="text-right font-semibold">
                        料金
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tuitionInfo.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.description ?? "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.price != null
                            ? `¥${item.price.toLocaleString()}`
                            : item.price_text ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Notes */}
      <section className="max-w-2xl mx-auto">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">ご注意事項</h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>表示の料金はすべて税込です。</li>
              <li>
                教材費は別途必要となる場合があります。詳しくはお問い合わせください。
              </li>
              <li>
                定額制プランの適用条件については、お電話またはお問い合わせフォームよりご確認ください。
              </li>
              <li>料金は変更になる場合があります。最新の情報はお問い合わせください。</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
