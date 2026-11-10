"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { http } from "@/services/http";
import { cn } from "@/lib/utils";

interface ForgotPasswordResponse {
  delivery: string;
  emailMasked?: string;
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState("");
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      await http.post<ForgotPasswordResponse>("/auth/forgot-password", {
        email: cleanEmail,
      });
      setSentToEmail(cleanEmail);
      setMessage(
        "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến (và thư mục spam nếu cần)."
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể gửi email khôi phục. Vui lòng thử lại sau."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyRecoveryOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!sentToEmail || otpCode.trim().length !== 6) return;
    setVerifyingOtp(true);
    setError("");
    try {
      const res = await http.post<{ token: string }>("/auth/forgot-password/verify-otp", {
        email: sentToEmail,
        code: otpCode.trim(),
      });
      router.push(`/reset-password?token=${encodeURIComponent(res.token)}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Mã xác nhận khôi phục không hợp lệ hoặc đã hết hạn."
      );
    } finally {
      setVerifyingOtp(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 rounded text-rose-300 text-xs"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 rounded text-emerald-300 text-xs leading-relaxed"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSendEmail} noValidate className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-2"
          >
            Email <span className="text-rose-400">*</span>
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "w-full rounded bg-[#051424] border border-white/10 text-white placeholder:text-ocean-light/30 px-3 py-2 text-sm transition-colors focus:outline-none focus:border-ocean-secondary",
              error && "border-rose-500/50"
            )}
            placeholder="name@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="w-full py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Đang gửi..." : "Gửi liên kết"}
        </button>
      </form>

      {/* Alternative verification using 6-digit OTP code directly from email */}
      {sentToEmail && (
        <form
          onSubmit={handleVerifyRecoveryOtp}
          className="pt-4 border-t border-white/10 space-y-3 animate-fade-in"
        >
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70">
            Hoặc nhập mã khôi phục 6 chữ số từ email
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="flex-1 rounded bg-[#051424] border border-white/10 text-white text-center font-mono text-base font-bold tracking-widest px-3 py-2 focus:outline-none focus:border-ocean-secondary"
            />
            <button
              type="submit"
              disabled={verifyingOtp || otpCode.length !== 6}
              className="px-4 py-2 rounded bg-ocean-secondary/20 hover:bg-ocean-secondary/30 text-ocean-light font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {verifyingOtp ? "Đang kiểm tra..." : "Xác nhận mã"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
