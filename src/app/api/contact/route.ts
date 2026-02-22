import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
}

const VALID_CATEGORIES = [
  "course",
  "tuition",
  "enrollment",
  "schedule",
  "other",
];

export async function POST(request: NextRequest) {
  try {
    const body: ContactSubmission = await request.json();

    // Validate required fields
    const errors: string[] = [];

    if (!body.name?.trim()) {
      errors.push("お名前は必須です");
    }

    if (!body.email?.trim()) {
      errors.push("メールアドレスは必須です");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push("正しいメールアドレスを入力してください");
    }

    if (!body.category) {
      errors.push("お問い合わせカテゴリは必須です");
    } else if (!VALID_CATEGORIES.includes(body.category)) {
      errors.push("無効なカテゴリです");
    }

    if (!body.subject?.trim()) {
      errors.push("件名は必須です");
    }

    if (!body.message?.trim()) {
      errors.push("お問い合わせ内容は必須です");
    } else if (body.message.trim().length < 10) {
      errors.push("お問い合わせ内容は10文字以上で入力してください");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join("、"), errors },
        { status: 400 }
      );
    }

    // Insert into database
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone?.trim() || null,
        category: body.category,
        subject: body.subject.trim(),
        message: body.message.trim(),
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert contact submission:", error);
      return NextResponse.json(
        { error: "送信に失敗しました。時間をおいて再度お試しください。" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "お問い合わせを受け付けました。",
        id: data.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました。" },
      { status: 500 }
    );
  }
}
