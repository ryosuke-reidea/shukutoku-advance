import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Verify domain restriction for student login
      const { data: { user } } = await supabase.auth.getUser()
      if (user && next.startsWith('/student') && !user.email?.endsWith('@shukutoku.ed.jp')) {
        await supabase.auth.signOut()
        const redirectBase = getRedirectBase(request, origin)
        return NextResponse.redirect(`${redirectBase}/auth/student-login?error=invalid_domain`)
      }

      const redirectBase = getRedirectBase(request, origin)
      return NextResponse.redirect(`${redirectBase}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/student-login?error=auth_failed`)
}

function getRedirectBase(request: Request, origin: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  if (isLocalEnv) return origin
  if (forwardedHost) return `https://${forwardedHost}`
  return origin
}
