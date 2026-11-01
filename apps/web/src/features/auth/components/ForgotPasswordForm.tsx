"use client";
import { useState } from "react";
import { http } from "@/services/http";
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="flex flex-col gap-5" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      const result = await http.post<{ delivery: string }>("/auth/forgot-password", { email });
      setMessage(result.delivery === "development" ? "Nếu tài khoản tồn tại, hướng dẫn khôi phục đã được tạo trong hộp thư thử nghiệm của môi trường phát triển." : "Nếu tài khoản tồn tại, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo hướng dẫn khôi phục."); }
    finally { setBusy(false); }
  }}>
    <label className="input-label" htmlFor="forgot-email">Địa chỉ email</label>
    <input className="input-ocean" id="forgot-email" type="email" autoComplete="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    <button className="btn-primary" disabled={busy || !email.trim()}>{busy ? "Đang xử lý..." : "Gửi hướng dẫn khôi phục"}</button>
  </form>;
}
