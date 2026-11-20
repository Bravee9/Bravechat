/**
 * app/(marketing)/terms/page.tsx
 * Terms of Service — Multi-language Legal Pack
 */

import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Điều khoản Sử dụng",
  description:
    "Điều khoản Sử dụng của Bravechat — các quyền, nghĩa vụ và quy tắc áp dụng khi sử dụng nền tảng.",
};

export default function TermsPage() {
  return <LegalLayout pageKey="terms" />;
}
