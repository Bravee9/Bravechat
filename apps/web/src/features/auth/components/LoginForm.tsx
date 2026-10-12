/**
 * components/auth/LoginForm.tsx
 * Login form with client-side validation — Ocean design
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginForm() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.email.trim()) {
      errs.email = "Email không được để trống.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Email không hợp lệ.";
    }
    if (!form.password) {
      errs.password = "Mật khẩu không được để trống.";
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
    setIsLoading(true);

    try {
      // TODO: Call API POST /api/auth/login
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            password: form.password,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.message ?? "Đăng nhập thất bại. Vui lòng thử lại." });
        return;
      }

      // Redirect to app on success
      window.location.href = "/channels/@me";
    } catch {
      setErrors({ general: "Không thể kết nối đến máy chủ. Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* General error */}
      {errors.general && (
        <div
          id="login-error-general"
          className="border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-rose-400 text-sm flex items-start gap-2"
          role="alert"
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errors.general}
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="login-email" className="input-label">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={handleChange}
          placeholder="ten@example.com"
          className={cn(
            "w-full bg-white/5 backdrop-blur-md border border-white/10 text-ocean-light placeholder:text-ocean-light/40 px-4 py-3 font-sans text-sm transition-all duration-300 focus:outline-none focus:border-ocean-secondary/60 focus:bg-white/10 focus:shadow-ocean-glow",
            errors.email && "border-rose-500/50 focus:border-rose-500/70"
          )}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1 h-1 bg-rose-400 inline-block flex-shrink-0" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="login-password" className="input-label mb-0">
            Mật khẩu
          </label>
          <Link
            href="/forgot-password"
            className="text-ocean-light/70 text-xs hover:text-ocean-secondary transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={cn(
              "w-full bg-white/5 backdrop-blur-md border border-white/10 text-ocean-light placeholder:text-ocean-light/40 px-4 py-3 pr-12 font-sans text-sm transition-all duration-300 focus:outline-none focus:border-ocean-secondary/60 focus:bg-white/10 focus:shadow-ocean-glow",
              errors.password && "border-rose-500/50 focus:border-rose-500/70"
            )}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            id="toggle-password-visibility"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ocean-light/60 hover:text-ocean-secondary transition-colors"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="square" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1 h-1 bg-rose-400 inline-block flex-shrink-0" />
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        id="login-submit"
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full mt-2 bg-ocean-primary/80 backdrop-blur-md hover:bg-ocean-primary border border-white/10 text-white px-6 py-3 font-bold uppercase tracking-widest text-sm transition-all duration-300 shadow-ocean-glow hover:shadow-ocean-panel cursor-pointer select-none",
          isLoading && "opacity-60 cursor-not-allowed hover:bg-ocean-primary/80 hover:shadow-ocean-glow"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang đăng nhập...
          </span>
        ) : (
          "Đăng nhập"
        )}
      </button>

    </form>
  );
}
