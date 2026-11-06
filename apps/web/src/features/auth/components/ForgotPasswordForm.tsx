"use client";
import { useState } from "react";
import { http } from "@/services/http";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-5"
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
    >
      <label className="input-label" htmlFor="forgot-email">Địa chỉ email</label>
      <input
        className="input-ocean"
        id="forgot-email"
        type="email"
        autoComplete="email"
        value={email}
        required
        onChange={(event) => setEmail(event.target.value)}
      />
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
      {devResetUrl && (
        <a
          href={devResetUrl}
          className="block rounded-lg border border-ocean-accent/40 bg-ocean-accent/20 p-3 text-center text-xs font-semibold text-ocean-accent hover:bg-ocean-accent/30 transition-all shadow-md"
        >
          👉 Bấm vào đây để đặt lại mật khẩu ngay (Dev Link)
        </a>
      )}
      <button className="btn-primary" disabled={busy || !email.trim()}>
        {busy ? "Đang xử lý..." : "Gửi hướng dẫn khôi phục"}
      </button>
    </form>
  );
}
