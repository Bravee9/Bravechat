/**
 * features/auth/components/RegisterForm.tsx
 * Account registration form
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";

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

const INPUT_BASE =
  "w-full h-10 rounded-[4px] bg-[#232428] border border-[#6E7076] hover:border-[#8C8F96] text-white placeholder:text-[#8E9199] px-3 text-[13px] transition-colors focus:outline-none focus:border-[#4CA0FF] focus:ring-1 focus:ring-[#4CA0FF]";

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

    if (!form.email.trim()) {
      errs.email = "Chưa nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Email cần có định dạng hợp lệ (ví dụ: ten@domain.com).";
    }

    if (!form.username.trim()) {
      errs.username = "Chưa nhập tên người dùng.";
    } else if (form.username.length < 3) {
      errs.username = "Tên người dùng cần ít nhất 3 ký tự.";
    } else if (form.username.length > 32) {
      errs.username = "Tên người dùng tối đa 32 ký tự.";
    } else if (!/^[a-z0-9._]+$/.test(form.username)) {
      errs.username = "Chỉ dùng chữ thường, số, dấu chấm và gạch dưới.";
    }

    if (form.displayName.length > 32) {
      errs.displayName = "Tên hiển thị tối đa 32 ký tự.";
    }

    if (!form.password) {
      errs.password = "Chưa nhập mật khẩu.";
    } else if (form.password.length < 8) {
      errs.password = "Mật khẩu cần ít nhất 8 ký tự.";
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = "Chưa xác nhận mật khẩu.";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Hai mật khẩu chưa trùng khớp.";
    }

    if (!form.agreeToTerms) {
      errs.agreeToTerms = "Bạn cần đồng ý với điều khoản để tiếp tục.";
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
      const res = await fetch(`${env.apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          username: form.username.trim().toLowerCase(),
          displayName: form.displayName.trim() || form.username,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({
          general: data.message ?? "Đăng ký thất bại. Vui lòng thử lại.",
        });
        return;
      }

      window.location.href = "/channels/@me";
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

  const strengthColors = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-yellow-400",
    "bg-emerald-500",
  ];
  const strengthLabels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
      {errors.general && (
        <div
          id="register-error-general"
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-3.5 py-2.5 text-red-200 text-xs"
          role="alert"
        >
          {errors.general}
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="register-email"
          className="block text-xs font-medium text-[#D1D3DA] mb-1.5"
        >
          Email <span aria-hidden="true" className="text-red-400">*</span>
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="next"
          autoFocus
          required
          value={form.email}
          onChange={handleChange}
          placeholder="Nhập email"
          aria-invalid={!!errors.email}
          className={cn(
            INPUT_BASE,
            errors.email && "border-red-400/75 focus:border-red-400 focus:ring-red-400/20"
          )}
        />
        {errors.email && (
          <p className="text-red-300 text-xs mt-1.5">{errors.email}</p>
        )}
      </div>

      {/* Username + Display name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="register-username"
            className="block text-xs font-medium text-[#D1D3DA] mb-1.5"
          >
            Tên người dùng <span aria-hidden="true" className="text-red-400">*</span>
          </label>
          <input
            id="register-username"
            name="username"
            type="text"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            required
            value={form.username}
            onChange={handleChange}
            placeholder="nguyen_minh"
            maxLength={32}
            aria-invalid={!!errors.username}
            className={cn(
              INPUT_BASE,
              "font-mono",
              errors.username && "border-red-400/75 focus:border-red-400 focus:ring-red-400/20"
            )}
          />
          {errors.username ? (
            <p className="text-red-300 text-xs mt-1.5">{errors.username}</p>
          ) : (
            <p className="text-[#9CA3AF] text-[11px] mt-1">
              Chỉ a-z, 0-9, dấu . và _
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="register-display-name"
            className="block text-xs font-medium text-[#D1D3DA] mb-1.5"
          >
            Tên hiển thị
          </label>
          <input
            id="register-display-name"
            name="displayName"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            value={form.displayName}
            onChange={handleChange}
            placeholder="Nguyễn Minh"
            maxLength={32}
            aria-invalid={!!errors.displayName}
            className={cn(
              INPUT_BASE,
              errors.displayName && "border-red-400/75 focus:border-red-400 focus:ring-red-400/20"
            )}
          />
          {errors.displayName && (
            <p className="text-red-300 text-xs mt-1.5">{errors.displayName}</p>
          )}
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="register-password"
          className="block text-xs font-medium text-[#D1D3DA] mb-1.5"
        >
          Mật khẩu <span aria-hidden="true" className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            enterKeyHint="next"
            required
            value={form.password}
            onChange={handleChange}
            onFocus={() => setShowPasswordHints(true)}
            placeholder="Tạo mật khẩu"
            aria-invalid={!!errors.password}
            className={cn(
              INPUT_BASE,
              "pr-11",
              errors.password && "border-red-400/75 focus:border-red-400 focus:ring-red-400/20"
            )}
          />
          <button
            type="button"
            id="toggle-register-password"
            onClick={() => setShowPassword(!showPassword)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md text-[#A8AAB3] hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
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

        {/* Password strength meter */}
        {showPasswordHints && form.password && (
          <div className="mt-2.5 p-3 rounded-lg bg-[#1B1C20] border border-white/[0.08] animate-fade-in">
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    i <= passwordStrength
                      ? strengthColors[passwordStrength]
                      : "bg-white/10"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-[#B4B6BE] mb-1.5">
              Độ mạnh:{" "}
              <span
                className={cn(
                  "font-semibold",
                  passwordStrength <= 1 && "text-red-300",
                  passwordStrength === 2 && "text-amber-300",
                  passwordStrength === 3 && "text-yellow-300",
                  passwordStrength === 4 && "text-emerald-300"
                )}
              >
                {strengthLabels[passwordStrength] || "—"}
              </span>
            </p>
            <ul className="grid grid-cols-2 gap-1">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <li
                  key={req.label}
                  className={cn(
                    "text-[11px] flex items-center gap-1.5 transition-colors",
                    req.test(form.password)
                      ? "text-emerald-300"
                      : "text-[#9CA3AF]"
                  )}
                >
                  {req.test(form.password) ? (
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-current shrink-0 inline-block" />
                  )}
                  {req.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.password ? (
          <p className="text-red-300 text-xs mt-1.5">{errors.password}</p>
        ) : (
          <p className="text-[#9CA3AF] text-[11px] mt-1">
            Ít nhất 8 ký tự
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="register-confirm-password"
          className="block text-xs font-medium text-[#D1D3DA] mb-1.5"
        >
          Xác nhận mật khẩu <span aria-hidden="true" className="text-red-400">*</span>
        </label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          enterKeyHint="done"
          required
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Nhập lại mật khẩu"
          aria-invalid={!!errors.confirmPassword}
          className={cn(
            INPUT_BASE,
            errors.confirmPassword && "border-red-400/75 focus:border-red-400 focus:ring-red-400/20"
          )}
        />
        {errors.confirmPassword && (
          <p className="text-red-300 text-xs mt-1.5">{errors.confirmPassword}</p>
        )}
        {!errors.confirmPassword &&
          form.confirmPassword &&
          form.password === form.confirmPassword && (
            <p className="text-emerald-300 text-xs mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Mật khẩu khớp
            </p>
          )}
      </div>

      {/* Terms checkbox */}
      <div className="pt-0.5">
        <label
          htmlFor="register-terms"
          className="flex items-start gap-2.5 cursor-pointer group"
        >
          <div className="relative mt-0.5 shrink-0">
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
                "w-4 h-4 rounded border transition-colors flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[#4C8BF5]/50",
                form.agreeToTerms
                  ? "bg-[#2B66E0] border-[#2B66E0]"
                  : "border-[#5A5D65] bg-[#1D1E22] group-hover:border-[#8E929B]",
                errors.agreeToTerms && "border-red-400"
              )}
            >
              {form.agreeToTerms && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-[#B4B6BE] text-xs leading-relaxed">
            Tôi đồng ý với{" "}
            <a href="/terms" className="text-[#589DF6] hover:underline">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="/privacy" className="text-[#589DF6] hover:underline">
              Chính sách bảo mật
            </a>
            .
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-red-300 text-xs mt-1 ml-6">{errors.agreeToTerms}</p>
        )}
      </div>

      {/* Submit */}
      <button
        id="register-submit"
        type="submit"
        disabled={isLoading}
        className="w-full h-11 mt-1 rounded-full bg-[#2B66E0] hover:bg-[#3A75EE] text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}
