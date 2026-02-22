import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP, Geist_Mono } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "淑徳アドバンス | 淑徳高校の学校内予備校",
  description:
    "淑徳高校の生徒のための学校内予備校。プロの予備校講師による集団授業・個別指導で、移動時間ゼロ、圧倒的な低価格で質の高い受験対策を提供します。",
  openGraph: {
    title: "淑徳アドバンス | 淑徳高校の学校内予備校",
    description:
      "淑徳高校の生徒のための学校内予備校。プロの予備校講師による集団授業・個別指導。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${notoSerifJP.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
