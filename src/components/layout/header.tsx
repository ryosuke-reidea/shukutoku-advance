"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/timetable", label: "時間割・教室割" },
  { href: "/courses", label: "講座紹介" },
  { href: "/tuition", label: "授業料" },
  { href: "/flow", label: "お手続きの流れ" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 transition-colors hover:text-primary"
        >
          淑徳アドバンス
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/student-login">
              <LogIn className="size-4" />
              受講生ログイン
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/apply">
              お申し込み
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile Hamburger Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="メニューを開く"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="text-left text-lg font-bold">
                淑徳アドバンス
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-4">
              {navLinks.map((link) => (
                <SheetClose key={link.href} asChild>
                  <Link
                    href={link.href}
                    className="rounded-md px-3 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 px-4 pt-6">
              <SheetClose asChild>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/student-login">
                    <LogIn className="size-4" />
                    受講生ログイン
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild className="w-full">
                  <Link href="/apply">
                    お申し込み
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
