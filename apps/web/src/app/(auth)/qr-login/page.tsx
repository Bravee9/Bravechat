"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { ApiError, http } from "@/services/http";
import type { CurrentUser } from "@discord-clone/shared";

interface ScannedQrInfo {
  qrId: string;
  shortCode: string;
  device: {
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    expiresAt: string;
  };
}

function QrLoginApprovalContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [codeInput, setCodeInput] = useState(initialCode);
  const [scannedInfo, setScannedInfo] = useState<ScannedQrInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneState, setDoneState] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    http
      .get<{ user: CurrentUser }>("/auth/me")
      .then((res) => {
        setCurrentUser(res.user);
        setAuthChecked(true);
        if (initialCode) {
          void handleScanCode(initialCode);
        }
      })
      .catch(() => {
        setAuthChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function handleScanCode(codeToScan: string) {
    if (!codeToScan.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await http.post<ScannedQrInfo>("/auth/qr/scan", {
        code: codeToScan.trim(),
      });
      setScannedInfo(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setCurrentUser(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Không thể kiểm tra mã QR."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (!scannedInfo) return;
    setBusy(true);
    setError("");
    try {
      await http.post("/auth/qr/approve", { qrId: scannedInfo.qrId });
      setDoneState("approved");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể phê duyệt mã QR."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!scannedInfo) return;
    setBusy(true);
    setError("");
    try {
      await http.post("/auth/qr/reject", { qrId: scannedInfo.qrId });
      setDoneState("rejected");
    } catch {
      setDoneState("rejected");
    } finally {
      setBusy(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="py-6 text-center text-sm text-[#B4B6BE]">
        Đang kiểm tra trạng thái đăng nhập...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-lg bg-[#1D1E22] border border-white/10 text-xs text-[#D1D3DA] leading-relaxed">
          Thiết bị này chưa đăng nhập vào Bravechat. Hãy đăng nhập trên thiết bị này trước để phê duyệt mã QR.
        </div>
        <Link
          href={
            initialCode
              ? `/login?redirect=${encodeURIComponent(`/qr-login?code=${initialCode}`)}`
              : "/login"
          }
          className="h-11 flex items-center justify-center w-full rounded-full bg-[#2B66E0] hover:bg-[#3A75EE] text-white font-medium text-sm transition-colors"
        >
          Đi tới trang đăng nhập
        </Link>
      </div>
    );
  }

  if (doneState === "approved") {
    return (
      <div role="status" className="text-center space-y-4 py-2 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#2B66E0]/20 border border-[#589DF6]/50 text-[#589DF6] flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">
          Đã phê duyệt đăng nhập thành công
        </h3>
        <p className="text-xs text-[#B4B6BE] leading-relaxed">
          Thiết bị đang hiển thị mã QR ({scannedInfo?.shortCode}) đã được cấp phiên đăng nhập dưới tài khoản{" "}
          <strong className="text-white">@{currentUser.username}</strong>.
        </p>
        <Link
          href="/channels/@me"
          className="h-11 flex items-center justify-center w-full rounded-full bg-[#2B66E0] hover:bg-[#3A75EE] text-white font-medium text-sm transition-colors"
        >
          Quay lại Bravechat
        </Link>
      </div>
    );
  }

  if (doneState === "rejected") {
    return (
      <div role="status" className="text-center space-y-4 py-2 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/15 border border-red-400/40 text-red-300 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">
          Đã từ chối yêu cầu đăng nhập
        </h3>
        <p className="text-xs text-[#B4B6BE]">
          Mã QR đã bị vô hiệu hóa để bảo vệ tài khoản của bạn.
        </p>
        <Link
          href="/channels/@me"
          className="h-11 flex items-center justify-center w-full rounded-full border border-[#5A5D65] hover:bg-white/[0.06] text-white font-medium text-sm transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#1D1E22] border border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#2B66E0] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(
              currentUser.displayName?.[0] ||
              currentUser.username[0] ||
              "B"
            ).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser.displayName || currentUser.username}
            </p>
            <p className="text-[11px] text-[#9CA3AF] truncate">
              @{currentUser.username} · {currentUser.email}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#2B66E0]/20 text-[#589DF6] border border-[#589DF6]/30 shrink-0">
          Đang đăng nhập
        </span>
      </div>

      {!scannedInfo ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleScanCode(codeInput);
          }}
          className="space-y-3"
        >
          <label
            htmlFor="qr-code-input"
            className="block text-xs font-medium text-[#D1D3DA]"
          >
            Mã kết nối hoặc liên kết QR
          </label>
          <input
            id="qr-code-input"
            type="text"
            required
            placeholder="Ví dụ: BC-8F3A2C"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="w-full h-11 rounded-lg bg-[#1D1E22] border border-[#5A5D65] text-white text-center font-mono text-base font-bold tracking-widest uppercase px-3 focus:outline-none focus:border-[#4C8BF5] focus:ring-2 focus:ring-[#4C8BF5]/25"
          />
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-500/10 border border-red-400/35 text-xs text-red-200"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !codeInput.trim()}
            className="w-full h-11 rounded-full bg-[#2B66E0] hover:bg-[#3A75EE] text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Đang kiểm tra..." : "Kiểm tra thiết bị yêu cầu"}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3.5 rounded-lg bg-[#1D1E22] border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-medium text-[#D1D3DA]">
                Thiết bị đang chờ phê duyệt
              </span>
              <span className="font-mono font-semibold text-white bg-[#2B66E0]/25 px-2 py-0.5 rounded-md">
                {scannedInfo.shortCode}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#9CA3AF]">Địa chỉ IP:</span>
              <span className="font-mono text-white">
                {scannedInfo.device.ipAddress}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#9CA3AF] shrink-0">Trình duyệt:</span>
              <span className="text-right text-[#D1D3DA] truncate max-w-[200px]">
                {scannedInfo.device.userAgent}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 leading-relaxed">
            <strong>Lưu ý bảo mật:</strong> Chỉ phê duyệt nếu chính bạn vừa quét mã này trên thiết bị khác.
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-500/10 border border-red-400/35 text-xs text-red-200"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              className="h-10 rounded-full border border-red-400/40 bg-transparent hover:bg-red-500/10 text-red-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Từ chối
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleApprove}
              className="h-10 rounded-full bg-[#2B66E0] hover:bg-[#3A75EE] text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Đang xử lý..." : "Phê duyệt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QrLoginPage() {
  return (
    <AuthLayout
      title="Phê duyệt đăng nhập QR"
      subtitle="Kiểm tra thông tin thiết bị trước khi cấp quyền đăng nhập."
      switchText="Quay lại"
      switchLink="/channels/@me"
      switchLabel="Không gian làm việc"
    >
      <Suspense fallback={<p className="text-xs text-[#9CA3AF]">Đang tải...</p>}>
        <QrLoginApprovalContent />
      </Suspense>
    </AuthLayout>
  );
}
