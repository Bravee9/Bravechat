"use client";

import { useState } from "react";
import Link from "next/link";
import { http } from "@/services/http";
import { cn } from "@/lib/utils";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center text-ocean-light animate-fade-in py-2">
        <style>{`.auth-switch-link { display: none !important; }`}</style>
        <div className="w-12 h-12 rounded-full bg-ocean-primary/20 text-ocean-secondary flex items-center justify-center border border-ocean-secondary shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-white font-medium leading-relaxed max-w-xs">
          Mật khẩu đã được thay đổi thành công. Các phiên đăng nhập cũ đã được đăng xuất an toàn.
        </p>
        <div className="w-full pt-2">
          <Link
            className="w-full block text-center py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-sm transition-colors shadow-md"
            href="/login"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div role="alert" className="border border-rose-500/30 bg-rose-500/10 p-3.5 rounded text-rose-300 text-xs text-center leading-relaxed">
        Thiếu mã khôi phục hoặc liên kết không hợp lệ. Vui lòng yêu cầu liên kết mới từ trang quên mật khẩu.
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (password !== confirm) {
      setError("Hai mật khẩu chưa trùng khớp.");
      return;
    }

    setBusy(true);
    try {
      await http.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 rounded text-rose-300 text-xs"
        >
          {error}
        </div>
      )}

      {/* New Password */}
      <div>
        <label
          htmlFor="reset-password"
          className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-2"
        >
          Mật khẩu mới
        </label>
        <div className="relative">
          <input
            id="reset-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={cn(
              "w-full rounded bg-[#051424] border border-white/10 text-white placeholder:text-ocean-light/30 px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:border-ocean-secondary",
              error && "border-rose-500/50"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-light/50 hover:text-white transition-colors"
            aria-label={showPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-2"
        >
          Nhập lại mật khẩu
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={cn(
              "w-full rounded bg-[#051424] border border-white/10 text-white placeholder:text-ocean-light/30 px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:border-ocean-secondary",
              error && "border-rose-500/50"
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-light/50 hover:text-white transition-colors"
            aria-label={showConfirm ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
          >
            {showConfirm ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy || !password || !confirm}
        className="w-full mt-2 py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-sm transition-colors shadow-md disabled:opacity-50 cursor-pointer"
      >
        {busy ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
