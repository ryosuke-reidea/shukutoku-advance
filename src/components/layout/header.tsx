"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Phone, LogIn, ArrowRight, ChevronRight } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top accent bar - teal gradient */}
      <div
        className="h-1"
        style={{
          background: "linear-gradient(90deg, #1b99a4 0%, #15b8c4 40%, #f6ad3c 100%)",
        }}
      />

      {/* Main header area */}
      <div
        className={`w-full bg-white/95 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "shadow-lg shadow-slate-200/50"
            : "shadow-sm"
        }`}
        style={{
          borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
        }}
      >
        {/* Phone number bar - desktop only */}
        <div
          className={`hidden border-b border-slate-100 bg-slate-50/80 transition-all duration-300 lg:block ${
            scrolled ? "h-0 overflow-hidden opacity-0" : "h-auto opacity-100"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-end px-4 py-1.5 sm:px-6 lg:px-8">
            <a
              href="tel:03-3969-7411"
              className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors duration-200 hover:text-[#1b99a4]"
            >
              <Phone className="size-3" />
              <span>03-3969-7411</span>
            </a>
          </div>
        </div>

        {/* Main navigation bar */}
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
            scrolled ? "h-14 lg:h-16" : "h-16 lg:h-20"
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-baseline gap-1 transition-opacity duration-200 hover:opacity-80"
          >
            <span
              className="text-2xl font-bold tracking-wide"
              style={{
                color: "#1b99a4",
                fontFamily:
                  "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
              }}
            >
              淑徳
            </span>
            <span
              className={`font-medium tracking-widest text-slate-700 transition-all duration-300 ${
                scrolled ? "text-sm" : "text-base"
              }`}
              style={{ letterSpacing: "0.15em" }}
            >
              アドバンス
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900"
              >
                {link.label}
                {/* Underline animation - slides from left */}
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 origin-left scale-x-0 rounded-full transition-transform duration-300 ease-out group-hover:scale-x-100"
                  style={{ backgroundColor: "#1b99a4" }}
                />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center gap-3 lg:flex">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-[#1b99a4] text-[#1b99a4] transition-all duration-200 hover:bg-[#1b99a4]/5 hover:text-[#1b99a4]"
            >
              <Link href="/auth/student-login">
                <LogIn className="size-3.5" />
                受講生はこちら
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="border-0 text-white shadow-md transition-all duration-200 hover:shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, #f6ad3c 0%, #e8962e 100%)",
              }}
            >
              <Link href="/apply">
                お申し込み
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-700 lg:hidden"
                aria-label="メニューを開く"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              {/* Mobile menu teal accent bar */}
              <div
                className="h-1"
                style={{
                  background:
                    "linear-gradient(90deg, #1b99a4 0%, #15b8c4 40%, #f6ad3c 100%)",
                }}
              />

              <SheetHeader className="px-6 pb-2 pt-6">
                <SheetTitle className="flex items-baseline gap-1 text-left">
                  <span
                    className="text-xl font-bold"
                    style={{
                      color: "#1b99a4",
                      fontFamily:
                        "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
                    }}
                  >
                    淑徳
                  </span>
                  <span
                    className="text-sm font-medium tracking-widest text-slate-700"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    アドバンス
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* Phone number in mobile */}
              <div className="mx-6 mb-2 border-b border-slate-100 pb-4">
                <a
                  href="tel:03-3969-7411"
                  className="flex items-center gap-2 text-sm text-slate-500 transition-colors duration-200 hover:text-[#1b99a4]"
                >
                  <Phone className="size-3.5" />
                  <span>03-3969-7411</span>
                </a>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col px-3">
                {navLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between rounded-lg px-3 py-3.5 text-base font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span>{link.label}</span>
                      <ChevronRight
                        className="size-4 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#1b99a4]"
                      />
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              {/* CTA buttons */}
              <div className="mx-6 mt-4 flex flex-col gap-3 border-t border-slate-100 pt-6">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full border-[#1b99a4] text-[#1b99a4] transition-all duration-200 hover:bg-[#1b99a4]/5 hover:text-[#1b99a4]"
                  >
                    <Link href="/auth/student-login">
                      <LogIn className="size-4" />
                      受講生はこちら
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    className="w-full border-0 text-white shadow-md transition-all duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, #f6ad3c 0%, #e8962e 100%)",
                    }}
                  >
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
      </div>
    </header>
  );
}
