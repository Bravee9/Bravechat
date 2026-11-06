"use client";

import { useState } from "react";
import { http } from "@/services/http";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        setError("");
        setDevResetUrl(null);
        try {
          const result = await http.post<{ delivery: string; devResetUrl?: string }>("/auth/forgot-password", { email });
          if (result.devResetUrl) {
            setDevResetUrl(result.devResetUrl);
            setMessage("Liên kết đặt lại mật khẩu thử nghiệm đã được tạo thành công:");
          } else {
            setMessage(
              result.delivery === "development"
                ? "Nếu tài khoản tồn tại, hướng dẫn khôi phục đã được lưu trong thư mục .local/mail (hộp thư môi trường phát triển)."
                : "Nếu tài khoản tồn tại, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu."
            );
          }
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Không thể tạo hướng dẫn khôi phục.");
        } finally {
          setBusy(false);
        }
      }}
      noValidate
    >
      <div className="relative">
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          required
          placeholder=" "
          onChange={(event) => setEmail(event.target.value)}
          className={cn(
            "peer w-full h-13 pt-4 pb-1 px-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-ocean-light font-sans text-sm transition-all duration-200 focus:outline-none focus:border-ocean-secondary/60 focus:bg-white/10 focus:shadow-ocean-glow",
            error && "border-rose-500/40"
          )}
        />
        <label
          htmlFor="forgot-email"
          className="absolute left-4 top-1.5 text-[10px] font-bold text-ocean-secondary uppercase tracking-wider transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:text-ocean-light/50 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-ocean-secondary select-none"
        >
          Địa chỉ email
        </label>
      </div>

      {error && (
        <div role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div role="status" className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 rounded flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      {devResetUrl && (
        <a
          href={devResetUrl}
          className="block rounded-lg border border-ocean-secondary/40 bg-ocean-secondary/15 p-3 text-center text-xs font-semibold text-ocean-light hover:bg-ocean-secondary/25 transition-all shadow-md"
        >
          Liên kết đặt lại mật khẩu nhanh (Môi trường phát triển)
        </a>
      )}

      <button
        type="submit"
        className="btn-primary w-full py-3 mt-1 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
        disabled={busy || !email.trim()}
      >
        {busy ? "Đang xử lý..." : "Gửi hướng dẫn khôi phục"}
      </button>
    </form>
  );
}
