/**
 * components/auth/LoginForm.tsx
 * Discord-style credentials login with two-factor verification support
 */
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface VerificationChallenge {
  challengeToken: string;
  emailMasked: string;
  methods: Array<"gmail_otp" | "totp" | "backup_code">;
  delivery: "gmail" | "resend" | "development";
}

export function LoginForm() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Verification step (2FA / Gmail OTP when required by account security)
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.email.trim()) {
      errs.email = "Vui lòng nhập email hoặc tên đăng nhập.";
    }
    if (!form.password) {
      errs.password = "Vui lòng nhập mật khẩu.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setStatusMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(`${env.apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setErrors({
          general: body.message ?? "Tên đăng nhập hoặc mật khẩu không chính xác.",
        });
        return;
      }

      if (body.data?.requiresVerification) {
        setChallenge(body.data as VerificationChallenge);
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        return;
      }

      window.location.href = "/channels/@me";
    } catch {
      setErrors({ general: "Không thể kết nối đến máy chủ. Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent, overrideCode?: string) {
    e?.preventDefault();
    if (!challenge) return;
    const code = (overrideCode ?? otpDigits.join("")).trim();
    if (code.length < 6) {
      setErrors({ general: "Vui lòng nhập đủ 6 chữ số mã xác thực." });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const res = await fetch(`${env.apiUrl}/auth/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          challengeToken: challenge.challengeToken,
          code,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setErrors({
          general: body.message ?? "Mã xác thực không chính xác.",
        });
        return;
      }

      window.location.href = "/channels/@me";
    } catch {
      setErrors({ general: "Không thể kết nối đến máy chủ xác thực." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!challenge || resendCooldown > 0 || isLoading) return;
    setErrors({});
    setStatusMessage("");
    setIsLoading(true);
    try {
      const res = await fetch(`${env.apiUrl}/auth/login/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challengeToken: challenge.challengeToken }),
      });
      const body = await res.json();
      if (!res.ok) {
        setErrors({ general: body.message ?? "Không thể gửi lại mã xác thực." });
        return;
      }
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setStatusMessage("Đã gửi mã xác thực mới đến email của bạn.");
    } catch {
      setErrors({ general: "Không thể gửi lại mã xác thực." });
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (errors.general) setErrors({});

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    const full = next.join("");
    if (full.length === 6 && next.every((d) => d.length === 1)) {
      void handleVerifyOtp(undefined, full);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    if (pasted.length === 6) {
      void handleVerifyOtp(undefined, pasted);
    } else {
      otpInputRefs.current[Math.min(5, pasted.length)]?.focus();
    }
  }

  // Two-Factor / Email OTP Step
  if (challenge) {
    return (
      <div className="space-y-4 animate-fade-in" data-testid="login-step2-verification">
        <div className="text-center md:text-left">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Xác thực hai lớp
          </h2>
          <p className="text-xs text-ocean-light/70 mt-1 leading-relaxed">
            Nhập mã xác thực gồm 6 chữ số đã được gửi đến email{" "}
            <span className="text-white font-medium">{challenge.emailMasked}</span>.
          </p>
        </div>

        {errors.general && (
          <div
            id="login-error-general"
            role="alert"
            className="border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 rounded text-rose-300 text-xs"
          >
            {errors.general}
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className="border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 rounded text-emerald-300 text-xs"
          >
            {statusMessage}
          </div>
        )}

        <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-4">
          <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto pt-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                aria-label={`Mã số ${idx + 1}`}
                className="h-12 w-full rounded bg-[#051424] border border-white/10 text-center font-mono text-xl font-bold text-white focus:outline-none focus:border-ocean-secondary transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpDigits.join("").length < 6}
            className="w-full py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Đang xác thực..." : "Xác nhận"}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-2">
          <button
            type="button"
            onClick={() => {
              setChallenge(null);
              setErrors({});
            }}
            className="text-ocean-light/60 hover:text-white transition-colors cursor-pointer"
          >
            Quay lại đăng nhập
          </button>

          <button
            type="button"
            disabled={resendCooldown > 0 || isLoading}
            onClick={handleResendOtp}
            className={cn(
              "font-medium transition-colors",
              resendCooldown > 0
                ? "text-ocean-light/40 cursor-not-allowed"
                : "text-ocean-secondary hover:underline cursor-pointer"
            )}
          >
            {resendCooldown > 0
              ? `Gửi lại mã sau (${resendCooldown}s)`
              : "Gửi lại mã"}
          </button>
        </div>
      </div>
    );
  }

  // Primary Credentials Form
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {errors.general && (
        <div
          id="login-error-general"
          role="alert"
          className="border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 rounded text-rose-300 text-xs"
        >
          {errors.general}
        </div>
      )}

      {/* Email / Username field */}
      <div>
        <label
          htmlFor="login-email"
          className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-2"
        >
          Email hoặc tên đăng nhập <span className="text-rose-400">*</span>
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={handleChange}
          className={cn(
            "w-full rounded bg-[#051424] border border-white/10 text-white placeholder:text-ocean-light/30 px-3 py-2 text-sm transition-colors focus:outline-none focus:border-ocean-secondary",
            errors.email && "border-rose-500/50"
          )}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-rose-400 text-xs mt-1">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="login-password"
          className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-2"
        >
          Mật khẩu <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
            className={cn(
              "w-full rounded bg-[#051424] border border-white/10 text-white placeholder:text-ocean-light/30 px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:border-ocean-secondary",
              errors.password && "border-rose-500/50"
            )}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            id="toggle-password-visibility"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-light/50 hover:text-white transition-colors"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        {capsLockOn && (
          <p className="text-amber-300 text-[11px] mt-1">
            Phím Caps Lock đang bật.
          </p>
        )}

        {errors.password && (
          <p id="password-error" className="text-rose-400 text-xs mt-1">
            {errors.password}
          </p>
        )}

        <div className="mt-1.5">
          <Link
            href="/forgot-password"
            className="text-xs text-ocean-secondary hover:underline font-medium inline-block"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </div>

      {/* Primary Submit Button */}
      <button
        id="login-submit"
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-sm transition-colors shadow-md disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
