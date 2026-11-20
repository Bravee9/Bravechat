"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { http } from "@/services/http";
import { cn } from "@/lib/utils";

interface ForgotPasswordResponse {
  delivery: string;
  emailMasked?: string;
}

const INPUT_BASE =
  "w-full h-10 rounded-[4px] bg-[#232428] border border-[#6E7076] hover:border-[#8C8F96] text-white placeholder:text-[#8E9199] px-3 text-[13px] transition-colors focus:outline-none focus:border-[#4CA0FF] focus:ring-1 focus:ring-[#4CA0FF]";

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
      setError("Chưa nhập địa chỉ email.");
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
        "Hướng dẫn và mã khôi phục 6 chữ số đã được gửi tới email của bạn. Kiểm tra cả hộp thư đến và thư mục spam."
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể gửi email khôi phục. Vui lòng thử lại sau."
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
      const res = await http.post<{ token: string }>(
        "/auth/forgot-password/verify-otp",
        {
          email: sentToEmail,
          code: otpCode.trim(),
        }
      );
      router.push(`/reset-password?token=${encodeURIComponent(res.token)}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Mã xác nhận khôi phục không hợp lệ hoặc đã hết hạn."
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
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-3.5 py-2.5 text-red-200 text-xs leading-relaxed"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3.5 py-2.5 text-emerald-200 text-xs leading-relaxed"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSendEmail} noValidate className="flex flex-col gap-3.5">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-xs font-medium text-[#D1D3DA] mb-1.5"
          >
            Email
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="done"
            autoFocus
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            className={cn(
              INPUT_BASE,
              error && "border-red-400/75 focus:border-red-400 focus:ring-red-400/20"
            )}
            placeholder="Nhập email"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-full bg-white hover:bg-white/90 text-[#19191C] font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Đang gửi..." : "Gửi liên kết khôi phục"}
        </button>
      </form>

      {/* Alternative verification using 6-digit OTP code directly from email */}
      {sentToEmail && (
        <form
          onSubmit={handleVerifyRecoveryOtp}
          className="pt-4 border-t border-white/[0.1] space-y-3 animate-fade-in"
        >
          <label
            htmlFor="forgot-otp"
            className="block text-xs font-medium text-[#D1D3DA]"
          >
            Hoặc nhập mã khôi phục 6 chữ số từ email
          </label>

          <div className="flex gap-2">
            <input
              id="forgot-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="flex-1 h-11 rounded-lg bg-[#1D1E22] border border-[#5A5D65] text-white text-center font-mono text-base font-bold tracking-widest px-3 focus:outline-none focus:border-[#4C8BF5] focus:ring-2 focus:ring-[#4C8BF5]/25"
            />
            <button
              type="submit"
              disabled={verifyingOtp || otpCode.length !== 6}
              className="h-11 px-4 rounded-full bg-[#2B66E0] hover:bg-[#3A75EE] text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {verifyingOtp ? "Đang kiểm tra..." : "Xác nhận mã"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
