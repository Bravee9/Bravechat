/**
 * app/(marketing)/privacy/page.tsx
 * Privacy Policy — Multi-language Legal Pack
 */

import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Chính sách Bảo mật",
  description:
    "Chính sách Bảo mật của Bravechat — cách chúng tôi thu thập, xử lý và bảo vệ dữ liệu cá nhân của bạn.",
};

export default function PrivacyPage() {
  return <LegalLayout pageKey="privacy" />;
}
