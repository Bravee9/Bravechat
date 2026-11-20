/**
 * app/(auth)/login/page.tsx
 * Account login page
 */

import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản Bravechat.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Đăng nhập vào Bravechat"
      subtitle="Đăng nhập để truy cập các sản phẩm và dịch vụ của Bravechat."
    >
      <LoginForm />
    </AuthLayout>
  );
}
