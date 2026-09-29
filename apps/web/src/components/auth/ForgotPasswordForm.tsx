/**
 * components/auth/ForgotPasswordForm.tsx
 * Forgot password form with email input and sent confirmation state
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  function validate(): string {
    if (!email.trim()) return "Email không được để trống.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setIsLoading(true);
    try {
      // TODO: Call API POST /auth/forgot-password
      await new Promise((r) => setTimeout(r, 1200)); // UI demo
      setIsSent(true);
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSent) {
    return (
      <div
        id="forgot-password-success"
        className="flex flex-col items-center gap-6 py-4 text-center animate-fade-in"
      >
        {/* Success icon */}
        <div className="w-16 h-16 bg-ocean-primary/20 border border-ocean-primary/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-ocean-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h3 className="text-ocean-light font-black text-lg tracking-tight">Email đã được gửi</h3>
          <p className="text-ocean-light/70 text-sm mt-2 leading-relaxed">
            Nếu địa chỉ <span className="text-ocean-secondary font-bold">{email}</span> tồn tại
            trong hệ thống, bạn sẽ nhận được email chứa hướng dẫn đặt lại mật khẩu trong vài phút.
          </p>
        </div>

        <div className="border border-ocean-dark-border p-4 w-full text-left">
          <p className="text-ocean-light/60 text-xs font-mono leading-relaxed">
            Không nhận được email? Kiểm tra thư mục Spam hoặc thử lại sau vài phút.
          </p>
        </div>

        <button
          onClick={() => { setIsSent(false); setEmail(""); }}
          className="text-ocean-secondary text-sm hover:text-ocean-light transition-colors underline"
        >
          Thử địa chỉ email khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Error */}
      {error && (
        <div
          id="forgot-password-error"
          className="border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-400 text-sm flex items-start gap-2"
          role="alert"
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="forgot-email" className="input-label">
          Địa chỉ Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="ten@example.com"
          className={cn("input-ocean", error && "border-red-700")}
        />
        <p className="text-ocean-light/60 text-xs mt-2 leading-relaxed">
          Nhập địa chỉ email được dùng để đăng ký tài khoản Bravechat.
        </p>
      </div>

      {/* Submit */}
      <button
        id="forgot-password-submit"
        type="submit"
        disabled={isLoading}
        className={cn("btn-primary w-full mt-2", isLoading && "opacity-60 cursor-not-allowed")}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang gửi...
          </span>
        ) : (
          "Gửi hướng dẫn đặt lại mật khẩu"
        )}
      </button>
    </form>
  );
}
