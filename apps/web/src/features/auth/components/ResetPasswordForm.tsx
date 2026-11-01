"use client";
import { useState } from "react";
import Link from "next/link";
import { http } from "@/services/http";
export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (done) return <div role="status" className="space-y-4 text-ocean-light"><p>Mật khẩu đã được thay đổi. Các phiên cũ đã được đăng xuất.</p><Link className="btn-primary" href="/login">Đăng nhập</Link></div>;
  if (!token) return <p role="alert" className="text-rose-300">Thiếu mã khôi phục. Hãy yêu cầu liên kết mới.</p>;
  return <form className="flex flex-col gap-4" onSubmit={async (event) => {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("Hai mật khẩu chưa trùng khớp."); return; }
    setBusy(true);
    try { await http.post("/auth/reset-password", { token, password }); setDone(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể đổi mật khẩu."); }
    finally { setBusy(false); }
  }}>
    <label className="input-label" htmlFor="reset-password">Mật khẩu mới</label>
    <input id="reset-password" className="input-ocean" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
    <label className="input-label" htmlFor="confirm-password">Nhập lại mật khẩu</label>
    <input id="confirm-password" className="input-ocean" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    <button className="btn-primary" disabled={busy}>{busy ? "Đang lưu..." : "Đặt lại mật khẩu"}</button>
  </form>;
}
