"use client";

import React, { useEffect, useState } from "react";
import { http } from "@/services/http";

interface GmailStatus {
  configured: boolean;
  gmailUser: string | null;
  rawGmailUser?: string | null;
  provider: string;
}

interface GmailSmtpModalProps {
  onClose: () => void;
  onConfigured?: (status: GmailStatus) => void;
}

export function GmailSmtpModal({ onClose, onConfigured }: GmailSmtpModalProps) {
  const [gmailUser, setGmailUser] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [testRecipient, setTestRecipient] = useState("");
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    http
      .get<GmailStatus>("/auth/gmail-config")
      .then((res) => {
        setStatus(res);
        if (res.rawGmailUser) {
          setGmailUser(res.rawGmailUser);
          setTestRecipient(res.rawGmailUser);
        }
      })
      .catch(() => undefined);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await http.post<GmailStatus>("/auth/gmail-config", {
        gmailUser: gmailUser.trim(),
        gmailAppPassword: gmailAppPassword.trim(),
        ...(testRecipient.trim() ? { testRecipient: testRecipient.trim() } : {}),
      });
      setStatus(res);
      setMessage(
        testRecipient.trim()
          ? `Đã kết nối Gmail SMTP và gửi email xác thực tới ${testRecipient.trim()}.`
          : "Đã lưu cấu hình Gmail SMTP thành công."
      );
      onConfigured?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối máy chủ Gmail SMTP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Cấu hình gửi thư Gmail SMTP"
    >
      <div className="w-full max-w-lg rounded-lg bg-[#0b1d33] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Cấu hình máy chủ Gmail SMTP
            </h3>
            <p className="text-xs text-ocean-light/70 mt-0.5">
              Gửi mã xác thực và khôi phục mật khẩu trực tiếp qua hộp thư Gmail
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-white/10 text-ocean-light/70 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {status && (
            <div className="flex items-center justify-between px-3 py-2 rounded bg-[#051424] border border-white/10 text-xs">
              <span className="text-ocean-light/70">Trạng thái:</span>
              {status.configured ? (
                <span className="font-medium text-emerald-400">
                  Đang hoạt động ({status.gmailUser})
                </span>
              ) : (
                <span className="font-medium text-ocean-light/60">
                  Chưa cấu hình
                </span>
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-1.5">
              Địa chỉ Gmail gửi thư
            </label>
            <input
              type="email"
              required
              placeholder="name@gmail.com"
              value={gmailUser}
              onChange={(e) => setGmailUser(e.target.value)}
              className="w-full rounded bg-[#051424] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-ocean-secondary font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-1.5">
              Mật khẩu ứng dụng Google (App Password)
            </label>
            <input
              type="password"
              required
              placeholder="xxxx xxxx xxxx xxxx"
              value={gmailAppPassword}
              onChange={(e) => setGmailAppPassword(e.target.value)}
              className="w-full rounded bg-[#051424] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-ocean-secondary font-mono tracking-wider"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ocean-light/70 mb-1.5">
              Gửi thử nghiệm đến (Tùy chọn)
            </label>
            <input
              type="email"
              placeholder="recipient@gmail.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="w-full rounded bg-[#051424] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-ocean-secondary font-mono"
            />
          </div>

          {error && (
            <div role="alert" className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          {message && (
            <div role="status" className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              {message}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-transparent hover:bg-white/5 text-ocean-light/80 text-xs font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy || !gmailUser.trim() || !gmailAppPassword.trim()}
              className="px-4 py-2 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Đang kết nối..." : "Lưu cấu hình"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
