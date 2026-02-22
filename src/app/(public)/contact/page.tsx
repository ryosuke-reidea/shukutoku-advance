"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CATEGORIES = [
  { value: "course", label: "講座について" },
  { value: "tuition", label: "授業料について" },
  { value: "enrollment", label: "入塾について" },
  { value: "schedule", label: "時間割について" },
  { value: "other", label: "その他" },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  category?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "お名前を入力してください";
    }

    if (!formData.email.trim()) {
      newErrors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "正しいメールアドレスを入力してください";
    }

    if (!formData.category) {
      newErrors.category = "お問い合わせカテゴリを選択してください";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "件名を入力してください";
    }

    if (!formData.message.trim()) {
      newErrors.message = "お問い合わせ内容を入力してください";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "お問い合わせ内容は10文字以上で入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "送信に失敗しました");
      }

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "送信に失敗しました。時間をおいて再度お試しください。"
      );
    }
  };

  const handleChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">お問い合わせ</h1>
        <p className="text-muted-foreground">
          ご質問やご不明な点がございましたら、お気軽にお問い合わせください
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-3">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">お電話でのお問い合わせ</CardTitle>
              <CardDescription>受付時間: 平日 15:00〜21:00</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="tel:03-XXXX-XXXX"
                className="text-xl font-bold text-primary hover:underline"
              >
                03-XXXX-XXXX
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">メールでのお問い合わせ</CardTitle>
              <CardDescription>24時間受付</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:info@shukutoku-advance.jp"
                className="text-primary hover:underline break-all"
              >
                info@shukutoku-advance.jp
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">所在地</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>淑徳アドバンス</p>
              <p>東京都板橋区前野町5-14-1</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>お問い合わせフォーム</CardTitle>
              <CardDescription>
                以下のフォームに必要事項をご記入の上、送信してください。
                <span className="text-destructive"> *</span> は必須項目です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "success" ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-3">
                  <div className="text-green-600 text-4xl">&#10003;</div>
                  <h3 className="text-lg font-semibold text-green-800">
                    送信が完了しました
                  </h3>
                  <p className="text-sm text-green-700">
                    お問い合わせいただきありがとうございます。内容を確認の上、折り返しご連絡いたします。
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setStatus("idle")}
                    className="mt-4"
                  >
                    新しいお問い合わせ
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === "error" && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      お名前 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="山田 太郎"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      メールアドレス <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="example@email.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号（任意）</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="03-XXXX-XXXX"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>
                      お問い合わせカテゴリ{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleChange("category", value)}
                    >
                      <SelectTrigger
                        className={
                          errors.category ? "border-destructive" : ""
                        }
                      >
                        <SelectValue placeholder="カテゴリを選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      件名 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleChange("subject", e.target.value)}
                      placeholder="お問い合わせの件名"
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      お問い合わせ内容{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="お問い合わせ内容をご記入ください"
                      rows={6}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? "送信中..." : "送信する"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
