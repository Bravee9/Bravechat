/**
 * app/(auth)/register/page.tsx
 * Account registration page
 */

import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản Bravechat miễn phí để bắt đầu giao tiếp với cộng đồng.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Tạo tài khoản Bravechat"
      subtitle="Đăng ký miễn phí để kết nối cùng nhóm và cộng đồng."
      switchText="Đã có tài khoản?"
      switchLink="/login"
      switchLabel="Đăng nhập"
      wide
    >
      <RegisterForm />
    </AuthLayout>
  );
}
