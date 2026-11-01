import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
export const metadata: Metadata = { title: "Đặt lại mật khẩu", referrer: "no-referrer" };
export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return <AuthLayout title="Đặt lại mật khẩu" subtitle="Chọn mật khẩu mới cho tài khoản." switchText="Đã nhớ mật khẩu?" switchLink="/login" switchLabel="Đăng nhập"><ResetPasswordForm token={searchParams.token ?? ""} /></AuthLayout>;
}
