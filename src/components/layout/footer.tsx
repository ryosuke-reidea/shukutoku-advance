import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

const navLinks = [
  { href: "/timetable", label: "時間割・教室割" },
  { href: "/courses", label: "講座紹介" },
  { href: "/tuition", label: "授業料" },
  { href: "/flow", label: "お手続きの流れ" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight">
              淑徳アドバンス
            </h3>
            <p className="text-sm font-medium text-slate-300">
              株式会社RE-IDEA
            </p>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <span>東京都渋谷区</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-slate-500" />
                <a
                  href="tel:03-3969-7411"
                  className="transition-colors hover:text-white"
                >
                  03-3969-7411
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-slate-500" />
                <a
                  href="mailto:info@shukutokuadvance.com"
                  className="transition-colors hover:text-white"
                >
                  info@shukutokuadvance.com
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              ナビゲーション
            </h3>
            <nav>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              お手続き
            </h3>
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/apply"
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    お申し込み
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/student-login"
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    受講生ログイン
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-10 border-t border-slate-800 pt-8">
          <p className="text-center text-sm text-slate-500">
            &copy; 2016-2026 SHUKUTOKU ADVANCE
          </p>
        </div>
      </div>
    </footer>
  );
}
