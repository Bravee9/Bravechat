/**
 * app/login/page.tsx
 * Login page — Ocean theme with JWT auth
 */

import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản Bravechat của bạn để tiếp tục trò chuyện.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục trò chuyện với cộng đồng của bạn."
      switchText="Chưa có tài khoản?"
      switchLink="/register"
      switchLabel="Đăng ký ngay"
    >
      <LoginForm />
    </AuthLayout>
  );
}
