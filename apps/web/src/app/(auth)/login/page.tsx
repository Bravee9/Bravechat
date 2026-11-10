/**
 * app/login/page.tsx
 * Login page with Discord-style credentials & QR code authentication
 */

import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { QrLoginPanel } from "@/features/auth/components/QrLoginPanel";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản Bravechat.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Chào mừng trở lại!"
      subtitle="Rất vui được gặp lại bạn!"
      switchText="Cần tài khoản?"
      switchLink="/register"
      switchLabel="Đăng ký"
      sidePanel={<QrLoginPanel />}
    >
      <LoginForm />
    </AuthLayout>
  );
}
