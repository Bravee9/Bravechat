/**
 * components/auth/RegisterForm.tsx
 * Registration form with multi-step validation — Ocean design
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FormState {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  email?: string;
  username?: string;
  displayName?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  general?: string;
}

const PASSWORD_REQUIREMENTS = [
  { label: "Ít nhất 8 ký tự", test: (p: string) => p.length >= 8 },
  { label: "Có chữ hoa (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Có chữ số (0-9)", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "Có ký tự đặc biệt",
    test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
];

export function RegisterForm() {
  const [form, setForm] = useState<FormState>({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};

    // Email
    if (!form.email.trim()) {
      errs.email = "Email không được để trống.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Email không hợp lệ.";
    }

    // Username
    if (!form.username.trim()) {
      errs.username = "Tên người dùng không được để trống.";
    } else if (form.username.length < 3) {
      errs.username = "Tên người dùng phải có ít nhất 3 ký tự.";
    } else if (form.username.length > 32) {
      errs.username = "Tên người dùng tối đa 32 ký tự.";
    } else if (!/^[a-z0-9._]+$/.test(form.username)) {
      errs.username = "Chỉ dùng chữ thường, số, dấu chấm và gạch dưới.";
    }

    // Display name (optional but max 32)
    if (form.displayName.length > 32) {
      errs.displayName = "Tên hiển thị tối đa 32 ký tự.";
    }

    // Password
    if (!form.password) {
      errs.password = "Mật khẩu không được để trống.";
    } else if (form.password.length < 8) {
      errs.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    }

    // Confirm password
    if (!form.confirmPassword) {
      errs.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    // Terms
    if (!form.agreeToTerms) {
      errs.agreeToTerms = "Bạn phải đồng ý với điều khoản dịch vụ.";
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
      // TODO: Call API POST /api/auth/register
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            username: form.username.trim().toLowerCase(),
            displayName: form.displayName.trim() || form.username,
            password: form.password,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.message ?? "Đăng ký thất bại. Vui lòng thử lại." });
        return;
      }

      // Redirect to login or onboarding
      window.location.href = "/login?registered=true";
    } catch {
      setErrors({ general: "Không thể kết nối đến máy chủ. Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  const passwordStrength = PASSWORD_REQUIREMENTS.filter((r) =>
    r.test(form.password)
  ).length;

  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-500"];
  const strengthLabels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* General error */}
      {errors.general && (
        <div
          id="register-error-general"
          className="border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-400 text-sm"
          role="alert"
        >
          {errors.general}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="register-email" className="input-label">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={handleChange}
          placeholder="ten@example.com"
          className={cn("input-ocean", errors.email && "border-red-700")}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-400 inline-block" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Username + Display name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="register-username" className="input-label">
            Tên người dùng <span className="text-red-500">*</span>
          </label>
          <input
            id="register-username"
            name="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            placeholder="nguyen_minh"
            maxLength={32}
            className={cn("input-ocean font-mono", errors.username && "border-red-700")}
          />
          {errors.username ? (
            <p className="text-red-400 text-xs mt-1">{errors.username}</p>
          ) : (
            <p className="text-ocean-light/70 text-xs mt-1">
              Chỉ a-z, 0-9, dấu . và _
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-display-name" className="input-label">
            Tên hiển thị
          </label>
          <input
            id="register-display-name"
            name="displayName"
            type="text"
            value={form.displayName}
            onChange={handleChange}
            placeholder="Nguyễn Minh"
            maxLength={32}
            className={cn("input-ocean", errors.displayName && "border-red-700")}
          />
          {errors.displayName && (
            <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>
          )}
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="register-password" className="input-label">
          Mật khẩu <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            onFocus={() => setShowPasswordHints(true)}
            placeholder="••••••••"
            className={cn("input-ocean pr-12", errors.password && "border-red-700")}
          />
          <button
            type="button"
            id="toggle-register-password"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ocean-light/60 hover:text-ocean-secondary transition-colors"
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

        {/* Password strength meter */}
        {showPasswordHints && form.password && (
          <div className="mt-2 animate-fade-in">
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 transition-all duration-300",
                    i <= passwordStrength
                      ? strengthColors[passwordStrength]
                      : "bg-ocean-dark-border"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-ocean-light/60 mb-2">
              Độ mạnh:{" "}
              <span className={cn(
                "font-bold",
                passwordStrength <= 1 && "text-red-400",
                passwordStrength === 2 && "text-amber-400",
                passwordStrength === 3 && "text-yellow-400",
                passwordStrength === 4 && "text-emerald-400",
              )}>
                {strengthLabels[passwordStrength] || "—"}
              </span>
            </p>
            <ul className="flex flex-col gap-1">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <li
                  key={req.label}
                  className={cn(
                    "text-xs flex items-center gap-1.5 transition-colors",
                    req.test(form.password)
                      ? "text-emerald-400"
                      : "text-ocean-light/70"
                  )}
                >
                  {req.test(form.password) ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-3 h-3 border border-current inline-block" />
                  )}
                  {req.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="register-confirm-password" className="input-label">
          Xác nhận mật khẩu <span className="text-red-500">*</span>
        </label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          className={cn("input-ocean", errors.confirmPassword && "border-red-700")}
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
        )}
        {!errors.confirmPassword &&
          form.confirmPassword &&
          form.password === form.confirmPassword && (
            <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Mật khẩu khớp
            </p>
          )}
      </div>

      {/* Terms checkbox */}
      <div>
        <label
          htmlFor="register-terms"
          className="flex items-start gap-3 cursor-pointer group"
        >
          <div className="relative mt-0.5">
            <input
              id="register-terms"
              name="agreeToTerms"
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div
              className={cn(
                "w-4 h-4 border transition-all duration-200",
                form.agreeToTerms
                  ? "bg-ocean-primary border-ocean-primary"
                  : "border-ocean-dark-border group-hover:border-ocean-secondary",
                errors.agreeToTerms && "border-red-700"
              )}
            >
              {form.agreeToTerms && (
                <svg
                  className="w-full h-full p-0.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="square" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-ocean-light/80 text-sm leading-relaxed">
            Tôi đồng ý với{" "}
            <a href="/terms" className="text-ocean-secondary hover:text-ocean-light underline">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="/privacy" className="text-ocean-secondary hover:text-ocean-light underline">
              Chính sách bảo mật
            </a>{" "}
            của Bravechat.
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-red-400 text-xs mt-1 ml-7">{errors.agreeToTerms}</p>
        )}
      </div>

      {/* Submit */}
      <button
        id="register-submit"
        type="submit"
        disabled={isLoading}
        className={cn(
          "btn-primary w-full mt-2",
          isLoading && "opacity-60 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang tạo tài khoản...
          </span>
        ) : (
          "Tạo tài khoản miễn phí"
        )}
      </button>
    </form>
  );
}
