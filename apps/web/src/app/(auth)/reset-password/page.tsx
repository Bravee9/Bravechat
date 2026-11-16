import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
export const metadata: Metadata = { title: "Đặt lại mật khẩu", referrer: "no-referrer" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthLayout title="Đặt lại mật khẩu" subtitle="Chọn mật khẩu mới cho tài khoản." switchText="Đã nhớ mật khẩu?" switchLink="/login" switchLabel="Đăng nhập"><ResetPasswordForm token={token ?? ""} /></AuthLayout>;
}
