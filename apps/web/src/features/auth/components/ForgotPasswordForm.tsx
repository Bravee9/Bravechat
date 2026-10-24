"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Password reset is intentionally not simulated while secure email delivery is unconfigured. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Tính năng đặt lại mật khẩu chưa được kích hoạt vì hệ thống chưa cấu hình dịch vụ gửi email. Vui lòng liên hệ quản trị viên để được hỗ trợ.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="forgot-email" className="input-label">Địa chỉ email</label>
        <input id="forgot-email" name="email" type="email" autoComplete="email" autoFocus value={email} onChange={(event) => { setEmail(event.target.value); setMessage(""); }} placeholder="ten@example.com" className={cn("input-ocean w-full", message && "border-amber-500/50")} />
        <p className="mt-2 text-xs leading-relaxed text-ocean-light/60">Nhập địa chỉ email dùng để đăng ký tài khoản Bravechat.</p>
      </div>
      {message ? <p id="forgot-password-unavailable" role="status" className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{message}</p> : null}
      <button id="forgot-password-submit" type="submit" disabled={!email.trim()} className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-50">Kiểm tra khả năng đặt lại mật khẩu</button>
    </form>
  );
}
