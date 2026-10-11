/**
 * apps/web/src/app/layout.tsx
 * Root layout — applies dark mode class, font, metadata
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { Analytics } from "@/components/consent/Analytics";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bravechat — Communicate, Freely.",
    template: "%s | Bravechat",
  },
  description:
    "Bravechat is a real-time communication platform for communities, teams, and friends. Text, voice, video — all in one place.",
  keywords: [
    "chat",
    "discord clone",
    "real-time messaging",
    "voice chat",
    "communities",
    "ocean",
  ],
  authors: [{ name: "Bravee9", url: "https://github.com/Bravee9" }],
  creator: "Bravee9",
  openGraph: {
    title: "Bravechat — Communicate, Freely.",
    description: "Bravechat is a real-time communication platform for communities, teams, and friends. Text, voice, video — all in one place.",
    siteName: "Bravechat",
    // Ảnh OG lấy từ app/opengraph-image.tsx (1200x630)
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bravechat",
    description: "Real-time communication platform.",
    // Ảnh Twitter lấy từ app/twitter-image.tsx
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071A2C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-ocean-dark-bg text-ocean-light font-sans antialiased">
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
