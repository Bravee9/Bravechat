/**
 * app/register/page.tsx
 * Registration page
 */

import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản Bravechat miễn phí để bắt đầu giao tiếp với cộng đồng.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Tham gia cộng đồng Bravechat — miễn phí và không giới hạn."
      switchText="Đã có tài khoản?"
      switchLink="/login"
      switchLabel="Đăng nhập"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
