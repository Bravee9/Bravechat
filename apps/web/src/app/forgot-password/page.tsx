/**
 * app/forgot-password/page.tsx
 * Quên mật khẩu / Forgot Password
 */

import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu Bravechat.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập địa chỉ email đã đăng ký và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu."
      switchText="Đã nhớ mật khẩu?"
      switchLink="/login"
      switchLabel="Quay lại đăng nhập"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
