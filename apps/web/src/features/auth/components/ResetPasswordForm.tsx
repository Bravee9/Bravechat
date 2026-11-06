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
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm sm:text-base text-white font-medium leading-relaxed max-w-xs">
          Mật khẩu đã được thay đổi thành công. Các phiên cũ đã được đăng xuất an toàn.
        </p>
        <div className="w-full pt-2">
          <Link className="btn-primary w-full block text-center py-3 text-sm font-bold uppercase tracking-wider" href="/login">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div role="alert" className="border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-sm text-center">
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
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
      {/* Floating in-box field: New Password */}
      <div className="relative">
        <input
          id="reset-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          placeholder=" "
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={cn(
            "peer w-full h-13 pt-4 pb-1 pl-4 pr-11 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-ocean-light font-sans text-sm transition-all duration-200 focus:outline-none focus:border-ocean-secondary/60 focus:bg-white/10 focus:shadow-ocean-glow",
            error && "border-rose-500/40"
          )}
        />
        <label
          htmlFor="reset-password"
          className="absolute left-4 top-1.5 text-[10px] font-bold text-ocean-secondary uppercase tracking-wider transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:text-ocean-light/50 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-ocean-secondary select-none"
        >
          Mật khẩu mới
        </label>
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-ocean-light/50 hover:text-ocean-light transition-colors rounded"
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

      {/* Floating in-box field: Confirm Password */}
      <div className="relative">
        <input
          id="confirm-password"
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          placeholder=" "
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={cn(
            "peer w-full h-13 pt-4 pb-1 pl-4 pr-11 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-ocean-light font-sans text-sm transition-all duration-200 focus:outline-none focus:border-ocean-secondary/60 focus:bg-white/10 focus:shadow-ocean-glow",
            error && "border-rose-500/40"
          )}
        />
        <label
          htmlFor="confirm-password"
          className="absolute left-4 top-1.5 text-[10px] font-bold text-ocean-secondary uppercase tracking-wider transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:text-ocean-light/50 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-ocean-secondary select-none"
        >
          Nhập lại mật khẩu
        </label>
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-ocean-light/50 hover:text-ocean-light transition-colors rounded"
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

      {error && (
        <div role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !password || !confirm}
        className="btn-primary w-full py-3 mt-1 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
      >
        {busy ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
