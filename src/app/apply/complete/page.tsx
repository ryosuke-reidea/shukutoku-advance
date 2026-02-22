'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PAYMENT_METHODS } from '@/lib/constants'
import type { PaymentMethod } from '@/lib/types/database'
import { CheckCircle2, Home, User } from 'lucide-react'

export default function CompletePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>読み込み中...</p></div>}>
      <CompleteContent />
    </Suspense>
  )
}

function CompleteContent() {
  const searchParams = useSearchParams()
  const coursesParam = searchParams.get('courses') ?? ''
  const paymentMethod = (searchParams.get('payment') ?? 'bank_transfer') as PaymentMethod
  const courseCount = coursesParam.split(',').filter(Boolean).length

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
          <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">お申し込み完了</CardTitle>
          <CardDescription className="text-base">
            お申し込みありがとうございます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-slate-50 p-4 text-left">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              お申し込み内容
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">講座数</dt>
                <dd className="font-medium">{courseCount}講座</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">お支払い方法</dt>
                <dd className="font-medium">
                  {PAYMENT_METHODS[paymentMethod]}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left text-sm text-blue-800">
            <p>
              お申し込み内容の確認メールをお送りしました。
              確認が完了次第、担当者よりご連絡いたします。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="size-4" />
                トップページへ
              </Link>
            </Button>
            <Button asChild>
              <Link href="/student">
                <User className="size-4" />
                マイページへ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
