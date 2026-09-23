/**
 * apps/web/src/app/layout.tsx
 * Root layout — applies dark mode class, font, metadata
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
    type: "website",
    locale: "vi_VN",
    url: "https://bravechat.app",
    siteName: "Bravechat",
    title: "Bravechat — Communicate, Freely.",
    description:
      "Real-time communication platform for communities, teams, and friends.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bravechat — Communicate, Freely.",
    description: "Real-time chat, voice, and video for everyone.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#051014",
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
      </body>
    </html>
  );
}
