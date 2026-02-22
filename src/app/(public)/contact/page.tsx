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
    <div className="min-h-screen" style={{ backgroundColor: "#fffaf3" }}>
      {/* Page Header */}
      <section className="page-header">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            お問い合わせ
          </h1>
          <div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ backgroundColor: "#1b99a4" }}
          />
          <p className="text-muted-foreground text-lg">
            ご質問やご不明な点がございましたら、お気軽にお問い合わせください
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-3">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-5 animate-fade-in-left">
              {/* Phone Card */}
              <Card
                className="hover-lift border-l-4 overflow-hidden"
                style={{ borderLeftColor: "#1b99a4" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
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
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">
                        お電話でのお問い合わせ
                      </CardTitle>
                      <CardDescription className="text-xs">
                        受付時間: 平日 15:00〜21:00
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <a
                    href="tel:03-3969-7411"
                    className="text-xl font-bold hover:underline transition-colors"
                    style={{ color: "#1b99a4" }}
                  >
                    03-3969-7411
                  </a>
                </CardContent>
              </Card>

              {/* Email Card */}
              <Card
                className="hover-lift border-l-4 overflow-hidden"
                style={{ borderLeftColor: "#1b99a4" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
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
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">
                        メールでのお問い合わせ
                      </CardTitle>
                      <CardDescription className="text-xs">
                        24時間受付
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <a
                    href="mailto:info@shukutokuadvance.com"
                    className="hover:underline break-all text-sm font-medium transition-colors"
                    style={{ color: "#1b99a4" }}
                  >
                    info@shukutokuadvance.com
                  </a>
                </CardContent>
              </Card>

              {/* Address Card */}
              <Card
                className="hover-lift border-l-4 overflow-hidden"
                style={{ borderLeftColor: "#1b99a4" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
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
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <CardTitle className="text-base font-bold">所在地</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium" style={{ color: "#181818" }}>
                    淑徳アドバンス
                  </p>
                  <p>東京都板橋区前野町5-14-1</p>
                </CardContent>
              </Card>

              {/* Decorative dots */}
              <div className="flex justify-center gap-2 pt-2">
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

            {/* Contact Form */}
            <div className="lg:col-span-2 animate-fade-in-right animation-delay-200">
              <Card className="overflow-hidden shadow-sm">
                {/* Top accent line */}
                <div
                  className="h-1"
                  style={{
                    background:
                      "linear-gradient(90deg, #1b99a4, #21b8c5, #f6ad3c)",
                  }}
                />
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    お問い合わせフォーム
                  </CardTitle>
                  <CardDescription>
                    以下のフォームに必要事項をご記入の上、送信してください。
                    <span className="text-destructive"> *</span> は必須項目です。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {status === "success" ? (
                    <div
                      className="rounded-xl p-8 text-center space-y-4 animate-scale-in"
                      style={{
                        background:
                          "linear-gradient(135deg, #e0f4f8, #fffaf3)",
                        border: "1px solid #1b99a4",
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                        style={{ backgroundColor: "#1b99a4" }}
                      >
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold" style={{ color: "#1b99a4" }}>
                        送信が完了しました
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        お問い合わせいただきありがとうございます。内容を確認の上、折り返しご連絡いたします。
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setStatus("idle")}
                        className="mt-4"
                        style={{
                          borderColor: "#1b99a4",
                          color: "#1b99a4",
                        }}
                      >
                        新しいお問い合わせ
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {status === "error" && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 animate-fade-in-up">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-red-500 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4m0 4h.01" />
                            </svg>
                            {errorMessage}
                          </div>
                        </div>
                      )}

                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-medium">
                          お名前 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="山田 太郎"
                          className={`transition-all focus:ring-2 focus:ring-[#1b99a4]/30 focus:border-[#1b99a4] ${
                            errors.name ? "border-destructive" : ""
                          }`}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-medium">
                          メールアドレス <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="example@email.com"
                          className={`transition-all focus:ring-2 focus:ring-[#1b99a4]/30 focus:border-[#1b99a4] ${
                            errors.email ? "border-destructive" : ""
                          }`}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>

                      {/* Phone (optional) */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-medium">
                          電話番号（任意）
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder="03-3969-7411"
                          className="transition-all focus:ring-2 focus:ring-[#1b99a4]/30 focus:border-[#1b99a4]"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label className="font-medium">
                          お問い合わせカテゴリ{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => handleChange("category", value)}
                        >
                          <SelectTrigger
                            className={`transition-all focus:ring-2 focus:ring-[#1b99a4]/30 focus:border-[#1b99a4] ${
                              errors.category ? "border-destructive" : ""
                            }`}
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
                        <Label htmlFor="subject" className="font-medium">
                          件名 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => handleChange("subject", e.target.value)}
                          placeholder="お問い合わせの件名"
                          className={`transition-all focus:ring-2 focus:ring-[#1b99a4]/30 focus:border-[#1b99a4] ${
                            errors.subject ? "border-destructive" : ""
                          }`}
                        />
                        {errors.subject && (
                          <p className="text-sm text-destructive">
                            {errors.subject}
                          </p>
                        )}
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <Label htmlFor="message" className="font-medium">
                          お問い合わせ内容{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          placeholder="お問い合わせ内容をご記入ください"
                          rows={6}
                          className={`transition-all focus:ring-2 focus:ring-[#1b99a4]/30 focus:border-[#1b99a4] ${
                            errors.message ? "border-destructive" : ""
                          }`}
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
                        className="w-full text-white font-bold py-3 shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: "#1b99a4" }}
                        disabled={status === "submitting"}
                      >
                        {status === "submitting" ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            送信中...
                          </span>
                        ) : (
                          "送信する"
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
