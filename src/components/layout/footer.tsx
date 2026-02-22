import Link from "next/link";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";

const navLinks = [
  { href: "/timetable", label: "時間割・教室割" },
  { href: "/courses", label: "講座紹介" },
  { href: "/tuition", label: "授業料" },
  { href: "/flow", label: "お手続きの流れ" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export function Footer() {
  return (
    <footer className="relative">
      {/* Top gradient border bar */}
      <div
        className="h-[5px]"
        style={{
          background:
            "linear-gradient(90deg, #1b99a4 0%, #15b8c4 50%, #1a7a9e 100%)",
        }}
      />

      {/* Main footer content */}
      <div
        className="text-white"
        style={{
          backgroundColor: "#1e293b",
          backgroundImage:
            "linear-gradient(180deg, rgba(30, 41, 59, 1) 0%, rgba(25, 36, 52, 1) 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {/* Column 1: Logo & Company Info */}
            <div className="space-y-5">
              <div>
                <Link href="/" className="group inline-flex items-baseline gap-1">
                  <span
                    className="text-2xl font-bold tracking-wide transition-colors duration-200 group-hover:opacity-80"
                    style={{
                      color: "#1b99a4",
                      fontFamily:
                        "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
                    }}
                  >
                    淑徳
                  </span>
                  <span
                    className="text-base font-medium tracking-widest text-slate-200 transition-colors duration-200 group-hover:opacity-80"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    アドバンス
                  </span>
                </Link>
              </div>

              <p className="text-sm font-medium text-slate-300">
                株式会社RE-IDEA
              </p>

              <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                一人ひとりの学びに寄り添い、確かな成長をサポート。
                地域に根ざした温かい教育環境を提供しています。
              </p>
            </div>

            {/* Column 2: Navigation */}
            <div className="space-y-5">
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "#1b99a4" }}
              >
                ナビゲーション
              </h3>
              <nav>
                <ul className="space-y-3">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors duration-200 hover:text-[#1b99a4]"
                      >
                        <span
                          className="inline-block h-px w-0 transition-all duration-200 group-hover:w-3"
                          style={{ backgroundColor: "#1b99a4" }}
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Column 3: Contact Info */}
            <div className="space-y-5">
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "#1b99a4" }}
              >
                お問い合わせ
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: "#1b99a4" }}
                  />
                  <span className="text-slate-300">
                    東京都板橋区前野町5-14-1
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone
                    className="size-4 shrink-0"
                    style={{ color: "#1b99a4" }}
                  />
                  <a
                    href="tel:03-3969-7411"
                    className="text-slate-300 transition-colors duration-200 hover:text-[#1b99a4]"
                  >
                    03-3969-7411
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail
                    className="size-4 shrink-0"
                    style={{ color: "#1b99a4" }}
                  />
                  <a
                    href="mailto:info@shukutokuadvance.com"
                    className="text-slate-300 transition-colors duration-200 hover:text-[#1b99a4]"
                  >
                    info@shukutokuadvance.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick links row */}
          <div className="mt-12 border-t border-slate-700/60 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/apply"
                className="group inline-flex items-center gap-1.5 rounded-full border border-[#f6ad3c]/30 px-5 py-2 text-sm font-medium text-[#f6ad3c] transition-all duration-200 hover:border-[#f6ad3c]/60 hover:bg-[#f6ad3c]/10"
              >
                お申し込み
                <ExternalLink className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/student-login"
                className="group inline-flex items-center gap-1.5 rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-[#1b99a4]/60 hover:bg-[#1b99a4]/10 hover:text-[#1b99a4]"
              >
                受講生ログイン
                <ExternalLink className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 border-t border-slate-700/40 pt-8">
            <p className="text-center text-xs tracking-wider text-slate-500">
              &copy; 2016-2026 SHUKUTOKU ADVANCE
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
