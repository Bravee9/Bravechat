/**
 * app/(marketing)/cookies/page.tsx
 * Cookie Policy — Multi-language Legal Pack
 */

import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Chính sách Cookie",
  description:
    "Chính sách Cookie của Bravechat — cách chúng tôi sử dụng cookie để duy trì phiên đăng nhập và bảo mật tài khoản.",
};

export default function CookiesPage() {
  return <LegalLayout pageKey="cookies" />;
}
