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
        setError(err instanceof Error ? err.message : "Không thể kiểm tra mã QR.");
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
      setError(err instanceof Error ? err.message : "Không thể phê duyệt mã QR.");
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
      <div className="py-8 text-center text-sm text-ocean-light/70">
        Đang kiểm tra trạng thái đăng nhập của thiết bị...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 rounded bg-[#051424] border border-white/10 text-xs text-ocean-light/80 leading-relaxed">
          Thiết bị này chưa đăng nhập vào Bravechat. Để phê duyệt đăng nhập bằng mã QR cho thiết bị khác, bạn cần đăng nhập trên thiết bị này trước.
        </div>
        <Link
          href="/login"
          className="block w-full py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-center text-sm transition-colors"
        >
          Đi tới trang đăng nhập
        </Link>
      </div>
    );
  }

  if (doneState === "approved") {
    return (
      <div role="status" className="text-center space-y-4 py-4 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-full bg-ocean-primary/20 border border-ocean-secondary text-ocean-secondary flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">
          Đã phê duyệt đăng nhập thành công
        </h3>
        <p className="text-xs text-ocean-light/75 leading-relaxed">
          Thiết bị đang hiển thị mã QR ({scannedInfo?.shortCode}) đã được cấp phiên đăng nhập dưới tài khoản{" "}
          <strong className="text-ocean-secondary">@{currentUser.username}</strong>.
        </p>
        <Link
          href="/channels/@me"
          className="block w-full py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-center text-sm transition-colors"
        >
          Quay lại Bravechat
        </Link>
      </div>
    );
  }

  if (doneState === "rejected") {
    return (
      <div role="status" className="text-center space-y-4 py-4 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-white">Đã từ chối yêu cầu đăng nhập</h3>
        <p className="text-xs text-ocean-light/70">
          Mã QR đã bị vô hiệu hóa để bảo vệ tài khoản của bạn.
        </p>
        <Link
          href="/channels/@me"
          className="block w-full py-2.5 rounded bg-[#051424] hover:bg-[#051424]/80 border border-white/10 text-white font-medium text-center text-sm transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Logged-in user badge */}
      <div className="flex items-center justify-between p-3 rounded bg-[#051424] border border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-ocean-primary flex items-center justify-center text-xs font-bold text-white">
            {(currentUser.displayName?.[0] || currentUser.username[0] || "B").toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              {currentUser.displayName || currentUser.username}
            </p>
            <p className="text-[11px] text-ocean-light/60">
              @{currentUser.username} · {currentUser.email}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-ocean-secondary/20 text-ocean-secondary border border-ocean-secondary/30">
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
          <label className="block text-[11px] font-bold text-ocean-light/70 uppercase tracking-wider">
            Mã kết nối hoặc liên kết QR
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: BC-8F3A2C"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="w-full rounded bg-[#051424] border border-white/10 text-white text-center font-mono text-base font-bold tracking-widest uppercase px-3 py-2 focus:outline-none focus:border-ocean-secondary"
          />
          {error && (
            <div role="alert" className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !codeInput.trim()}
            className="w-full py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Đang kiểm tra..." : "Kiểm tra thiết bị yêu cầu"}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3.5 rounded bg-[#051424] border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-ocean-secondary uppercase tracking-wider text-[11px]">
                Thiết bị đang chờ phê duyệt
              </span>
              <span className="font-mono font-bold text-white bg-ocean-primary/30 px-2 py-0.5 rounded">
                {scannedInfo.shortCode}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ocean-light/60">Địa chỉ IP:</span>
              <span className="font-mono text-white">{scannedInfo.device.ipAddress}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ocean-light/60 flex-shrink-0">Trình duyệt:</span>
              <span className="text-right text-ocean-light truncate max-w-[220px]">
                {scannedInfo.device.userAgent}
              </span>
            </div>
          </div>

          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
            <strong>Cảnh báo bảo mật:</strong> Không phê duyệt nếu mã QR này do người lạ gửi cho bạn.
          </div>

          {error && (
            <div role="alert" className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              className="py-2.5 rounded bg-[#051424] hover:bg-[#051424]/80 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Từ chối
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleApprove}
              className="py-2.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Đang xử lý..." : "Phê duyệt đăng nhập"}
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
      title="Xác thực đăng nhập mã QR"
      subtitle="Kiểm tra thông tin thiết bị và phê duyệt phiên đăng nhập."
      switchText="Quay lại"
      switchLink="/channels/@me"
      switchLabel="Không gian làm việc"
    >
      <Suspense fallback={<p className="text-xs text-ocean-light/60">Đang tải...</p>}>
        <QrLoginApprovalContent />
      </Suspense>
    </AuthLayout>
  );
}
