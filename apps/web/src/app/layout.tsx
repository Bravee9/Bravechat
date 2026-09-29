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
    title: "Bravechat — Communicate, Freely.",
    description: "Bravechat is a real-time communication platform for communities, teams, and friends. Text, voice, video — all in one place.",
    url: "https://bravechat.app",
    siteName: "Bravechat",
    images: [
      {
        url: "/brave-chat.png",
        width: 1200,
        height: 630,
        alt: "Bravechat Logo",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bravechat",
    description: "Real-time communication platform.",
    images: ["/brave-chat.png"],
  },

  icons: {
    icon: "/favicon.png",
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
