/**
 * features/auth/components/LoginForm.tsx
 * Streamlined account login form with Email+Password, OTP Email, QR, and 2FA verification
 */
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";
import { QrLoginPanel } from "@/features/auth/components/QrLoginPanel";

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

type LoginMode = "credentials" | "gmail-otp" | "qr";

const INPUT_BASE =
  "w-full h-10 rounded-[4px] bg-[#232428] border border-[#6E7076] hover:border-[#8C8F96] text-white placeholder:text-[#8E9199] px-3 text-[13px] transition-colors focus:outline-none focus:border-[#4CA0FF] focus:ring-1 focus:ring-[#4CA0FF]";

export function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("credentials");
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [otpEmail, setOtpEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Verification step (2FA / Gmail OTP when required by account security)
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(
      () => setResendCooldown((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function redirectAfterLogin() {
    const nextPath = new URLSearchParams(window.location.search).get("redirect");
    if (nextPath && /^\/(?![/\\])/.test(nextPath)) {
      try {
        const resolved = new URL(nextPath, window.location.origin);
        if (resolved.origin === window.location.origin) {
          window.location.href = `${resolved.pathname}${resolved.search}${resolved.hash}`;
          return;
        }
      } catch {
        // Fallback to default route
      }
    }
    window.location.href = "/channels/@me";
  }

  function validateCredentials(): FormErrors {
    const errs: FormErrors = {};
    if (!form.email.trim()) {
      errs.email = "Chưa nhập email hoặc tên đăng nhập.";
    }
    if (!form.password) {
      errs.password = "Chưa nhập mật khẩu.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateCredentials();
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
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setErrors({
          general: body.message ?? "Email hoặc mật khẩu chưa đúng.",
        });
        setForm((prev) => ({ ...prev, password: "" }));
        requestAnimationFrame(() => passwordInputRef.current?.focus());
        return;
      }

      if (body.data?.requiresVerification) {
        setChallenge(body.data as VerificationChallenge);
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        return;
      }

      redirectAfterLogin();
    } catch {
      setErrors({ general: "Không thể kết nối đến máy chủ. Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestGmailOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = otpEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrors({ email: "Chưa nhập địa chỉ email." });
      return;
    }

    setErrors({});
    setStatusMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(`${env.apiUrl}/auth/login/gmail-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({ email: cleanEmail }),
      });

      const body = await res.json();
      if (!res.ok) {
        setErrors({
          general: body.message ?? "Không thể gửi mã xác thực tới email này.",
        });
        return;
      }

      if (body.data?.challengeToken) {
        setChallenge(body.data as VerificationChallenge);
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      }
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
        signal: AbortSignal.timeout(60000),
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

      redirectAfterLogin();
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
        setErrors({
          general: body.message ?? "Không thể gửi lại mã xác thực.",
        });
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

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
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

  function switchMode(nextMode: LoginMode) {
    setErrors({});
    setStatusMessage("");
    if (nextMode === "gmail-otp" && form.email.includes("@") && !otpEmail) {
      setOtpEmail(form.email);
    }
    setMode(nextMode);
  }

  // Two-Factor / Email OTP Challenge Step
  if (challenge) {
    return (
      <div className="space-y-4 animate-fade-in" data-testid="login-step2-verification">
        <button
          type="button"
          onClick={() => {
            setChallenge(null);
            setErrors({});
            setStatusMessage("");
          }}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4CA0FF] hover:text-[#78B7FF] hover:underline cursor-pointer"
        >
          <span aria-hidden="true">←</span> Tất cả tùy chọn đăng nhập
        </button>

        <div>
          <h2 className="text-sm font-semibold text-white">
            Nhập mã xác thực 6 chữ số
          </h2>
          <p className="text-xs text-[#C7C9D1] mt-1 leading-relaxed">
            Nếu email hợp lệ, mã xác thực đã được gửi tới{" "}
            <span className="text-white font-medium">{challenge.emailMasked}</span>.
          </p>
        </div>

        {errors.general && (
          <div
            id="login-error-general"
            role="alert"
            className="rounded-[4px] border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-200 text-xs"
          >
            {errors.general}
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className="rounded-[4px] border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-emerald-200 text-xs"
          >
            {statusMessage}
          </div>
        )}

        <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-3.5">
          <div className="grid grid-cols-6 gap-1.5 pt-1">
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
                className="h-11 w-full rounded-[4px] bg-[#232428] border border-[#6E7076] text-center font-mono text-base font-bold text-white focus:outline-none focus:border-[#4CA0FF] focus:ring-1 focus:ring-[#4CA0FF] transition-colors"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpDigits.join("").length < 6}
            className="w-full h-10 rounded-full bg-[#4682F5] hover:bg-[#5A91F7] text-white font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Đang xác thực..." : "Xác nhận"}
          </button>
        </form>

        <div className="flex items-center justify-center text-xs pt-1">
          <button
            type="button"
            disabled={resendCooldown > 0 || isLoading}
            onClick={handleResendOtp}
            className={cn(
              "font-medium transition-colors",
              resendCooldown > 0
                ? "text-[#8E9199] cursor-not-allowed"
                : "text-[#4CA0FF] hover:text-[#78B7FF] hover:underline cursor-pointer"
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

  // Passwordless Gmail OTP request view
  if (mode === "gmail-otp") {
    return (
      <div className="space-y-3.5 animate-fade-in">
        <button
          type="button"
          onClick={() => switchMode("credentials")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4CA0FF] hover:text-[#78B7FF] hover:underline cursor-pointer"
        >
          <span aria-hidden="true">←</span> Tất cả tùy chọn đăng nhập
        </button>

        {errors.general && (
          <div
            role="alert"
            className="rounded-[4px] border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-200 text-xs"
          >
            {errors.general}
          </div>
        )}

        <form onSubmit={handleRequestGmailOtp} noValidate className="flex flex-col gap-3">
          <div>
            <label htmlFor="otp-login-email" className="sr-only">
              Email
            </label>
            <input
              id="otp-login-email"
              name="otpEmail"
              type="email"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="done"
              autoFocus
              required
              value={otpEmail}
              onChange={(e) => {
                setOtpEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="Email"
              className={cn(
                INPUT_BASE,
                errors.email && "border-red-400 focus:border-red-400 focus:ring-red-400"
              )}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "otp-email-error" : undefined}
            />
            {errors.email && (
              <p id="otp-email-error" className="text-red-300 text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-full bg-white hover:bg-white/90 text-[#19191C] font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Đang gửi mã..." : "Tiếp tục"}
          </button>
        </form>
      </div>
    );
  }

  // QR Login view (inside the single card)
  if (mode === "qr") {
    return (
      <div className="space-y-3.5 animate-fade-in">
        <button
          type="button"
          onClick={() => switchMode("credentials")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4CA0FF] hover:text-[#78B7FF] hover:underline cursor-pointer"
        >
          <span aria-hidden="true">←</span> Tất cả tùy chọn đăng nhập
        </button>

        <QrLoginPanel />
      </div>
    );
  }

  // Primary Credentials Form
  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        {errors.general && (
          <div
            id="login-error-general"
            role="alert"
            className="rounded-[4px] border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-200 text-xs leading-relaxed"
          >
            {errors.general}
          </div>
        )}

        {/* Email / Username */}
        <div>
          <label htmlFor="login-email" className="sr-only">
            Email hoặc tên đăng nhập
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            autoFocus
            required
            value={form.email}
            onChange={handleChange}
            placeholder="Email hoặc tên đăng nhập"
            className={cn(
              INPUT_BASE,
              errors.email && "border-red-400 focus:border-red-400 focus:ring-red-400"
            )}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-red-300 text-xs mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="sr-only">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              ref={passwordInputRef}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              enterKeyHint="done"
              required
              value={form.password}
              onChange={handleChange}
              onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
              placeholder="Mật khẩu"
              className={cn(
                INPUT_BASE,
                "pr-9",
                errors.password && "border-red-400 focus:border-red-400 focus:ring-red-400"
              )}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              id="toggle-password-visibility"
              onClick={() => setShowPassword(!showPassword)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded text-[#C7C9D1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
            <p className="text-amber-300 text-xs mt-1">
              Phím Caps Lock đang bật.
            </p>
          )}

          {errors.password && (
            <p id="password-error" className="text-red-300 text-xs mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Pill Submit Button */}
        <button
          id="login-submit"
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-1 rounded-full bg-[#4682F5] hover:bg-[#5A91F7] text-white font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* Centered Forgot Password link */}
        <div className="text-center pt-1">
          <Link
            href="/forgot-password"
            className="text-[13px] text-[#4CA0FF] hover:text-[#78B7FF] hover:underline font-medium inline-block"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </form>

      {/* Divider */}
      <div className="my-3.5 text-center">
        <span className="text-xs text-[#A8AAB3]">hoặc</span>
      </div>

      {/* Outlined pill methods */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => switchMode("gmail-otp")}
          className="w-full h-10 rounded-full border border-[#5A5D65] bg-transparent hover:bg-white/[0.05] hover:border-[#8C8F96] text-[13px] font-medium text-white flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Tiếp tục với mã OTP Email
        </button>

        <button
          type="button"
          onClick={() => switchMode("qr")}
          className="w-full h-10 rounded-full border border-[#5A5D65] bg-transparent hover:bg-white/[0.05] hover:border-[#8C8F96] text-[13px] font-medium text-white flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2m4 0h-2m-2-3h2v3m0 3h2"
            />
          </svg>
          Đăng nhập bằng mã QR
        </button>
      </div>

      {/* Create account prompt */}
      <p className="mt-4 text-center text-[12px] text-[#C7C9D1]">
        Mới dùng Bravechat?{" "}
        <Link
          href="/register"
          className="text-[#4CA0FF] hover:text-[#78B7FF] hover:underline font-medium transition-colors"
        >
          Tạo tài khoản
        </Link>
      </p>
    </div>
  );
}
