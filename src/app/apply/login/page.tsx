'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function ApplyLoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>読み込み中...</p></div>}>
      <ApplyLoginContent />
    </Suspense>
  )
}

function ApplyLoginContent() {
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const coursesParam = searchParams.get('courses') ?? ''
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push(`/apply/payment?courses=${coursesParam}`)
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleGoogleLogin = async () => {
    setLoginLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'shukutoku.ed.jp',
        },
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/apply/payment?courses=${coursesParam}`)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoginLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">ログイン</CardTitle>
          <CardDescription>
            お申し込みには学校のGoogleアカウントでのログインが必要です
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="w-full"
            size="lg"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loginLoading ? 'ログイン中...' : 'Googleアカウントでログイン'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            ※ @shukutoku.ed.jp のアカウントのみログイン可能です
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
