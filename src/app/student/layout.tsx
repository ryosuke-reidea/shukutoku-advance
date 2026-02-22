'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  DoorOpen,
  AlertTriangle,
  CreditCard,
  LogOut,
  Menu,
  GraduationCap,
  Home,
  Calendar,
} from 'lucide-react'

const navItems = [
  { href: '/student', label: '受講講座一覧', icon: BookOpen },
  { href: '/student/classroom', label: '教室割', icon: DoorOpen },
  { href: '/student/notes', label: '注意点', icon: AlertTriangle },
  { href: '/student/payments', label: '支払い状況', icon: CreditCard },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut, supabase } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTermName, setActiveTermName] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/student-login')
    }
  }, [user, loading, router])

  // アクティブな会期名を取得
  useEffect(() => {
    if (!user || !supabase) return
    const fetchTerm = async () => {
      const { data } = await supabase
        .from('terms')
        .select('name')
        .eq('is_active', true)
        .single()
      if (data) setActiveTermName(data.name)
    }
    fetchTerm()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = profile?.display_name || user.email || '受講生'
  const initials = displayName.slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/student-login')
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar size="lg">
          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.student_number
              ? `学籍番号: ${profile.student_number}`
              : '受講生'}
          </p>
        </div>
      </div>

      {/* 会期表示 */}
      {activeTermName && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
          <Calendar className="size-4 text-primary shrink-0" />
          <span className="text-xs font-medium text-primary truncate">{activeTermName}</span>
        </div>
      )}

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <Link
          href="/"
          onClick={() => setSheetOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Home className="size-4 shrink-0" />
          トップページ
        </Link>
        <div className="my-1.5 mx-3 h-px bg-border" />
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSheetOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Logout */}
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          ログアウト
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <GraduationCap className="size-5 text-primary" />
            <span className="text-sm font-bold">アドバンス受講生</span>
          </div>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card px-4 md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <GraduationCap className="size-5 text-primary" />
                  アドバンス受講生
                </SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold">アドバンス受講生</span>
          {activeTermName && (
            <Badge variant="outline" className="text-[10px] ml-auto">
              {activeTermName}
            </Badge>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-slate-50 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
