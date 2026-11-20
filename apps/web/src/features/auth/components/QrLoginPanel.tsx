"use client";

import React, { useCallback, useEffect, useState } from "react";
import { http } from "@/services/http";
import { QrCodeSvg } from "@/components/ui/QrCodeSvg";

interface QrInitResponse {
  qrId: string;
  pollSecret: string;
  shortCode: string;
  qrUrl: string;
  expiresAt: string;
}

interface QrStatusResponse {
  status: "PENDING" | "SCANNED" | "APPROVED" | "REJECTED" | "EXPIRED";
  shortCode?: string;
  scannedBy?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  expiresAt?: string;
}

export function QrLoginPanel() {
  const [qrData, setQrData] = useState<QrInitResponse | null>(null);
  const [status, setStatus] = useState<QrStatusResponse["status"]>("PENDING");
  const [scannedBy, setScannedBy] = useState<QrStatusResponse["scannedBy"]>(null);
  const [loading, setLoading] = useState(true);

  const initQrSession = useCallback(async () => {
    setLoading(true);
    setStatus("PENDING");
    setScannedBy(null);
    try {
      const res = await http.post<QrInitResponse>("/auth/qr/init");
      setQrData(res);
    } catch {
      setStatus("EXPIRED");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void initQrSession();
  }, [initQrSession]);

  // Expiration timer check based on expiresAt
  useEffect(() => {
    if (
      !qrData ||
      status === "EXPIRED" ||
      status === "REJECTED" ||
      status === "APPROVED"
    ) {
      return;
    }
    const checkTimer = () => {
      const remain = Math.floor(
        (new Date(qrData.expiresAt).getTime() - Date.now()) / 1000
      );
      if (remain <= 0) {
        setStatus("EXPIRED");
      }
    };
    const timer = setInterval(checkTimer, 1000);
    return () => clearInterval(timer);
  }, [qrData, status]);

  // Poll QR status
  useEffect(() => {
    if (
      !qrData ||
      status === "EXPIRED" ||
      status === "REJECTED" ||
      status === "APPROVED"
    ) {
      return;
    }
    let active = true;
    const poll = setInterval(async () => {
      try {
        const res = await http.get<QrStatusResponse>("/auth/qr/status", {
          query: { qrId: qrData.qrId, pollSecret: qrData.pollSecret },
        });
        if (!active) return;
        setStatus(res.status);
        if (res.scannedBy) setScannedBy(res.scannedBy);
        if (res.status === "APPROVED") {
          clearInterval(poll);
          window.location.href = "/channels/@me";
        }
      } catch {
        // Ignore transient poll failures
      }
    }, 1800);
    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [qrData, status]);

  return (
    <div
      className="flex flex-col items-center justify-center text-center select-none py-2"
      data-testid="qr-login-panel"
    >
      {/* State: Scanned, waiting for approval */}
      {status === "SCANNED" && scannedBy ? (
        <div className="w-full max-w-[240px] flex flex-col items-center space-y-4 py-3 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#2B66E0] ring-2 ring-[#589DF6]/60 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
            {scannedBy.avatarUrl ? (
              <img
                src={scannedBy.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (
                scannedBy.displayName?.[0] ||
                scannedBy.username[0] ||
                "B"
              ).toUpperCase()
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-[#589DF6]">Đã quét mã</p>
            <h3 className="text-base font-semibold text-white mt-0.5">
              {scannedBy.displayName || scannedBy.username}
            </h3>
            <p className="text-xs text-[#9CA3AF]">@{scannedBy.username}</p>
          </div>

          <p className="text-xs text-[#B4B6BE] leading-relaxed">
            Xác nhận đăng nhập trên thiết bị đã đăng nhập của bạn để tiếp tục.
          </p>

          <button
            type="button"
            onClick={() => void initQrSession()}
            className="text-xs font-medium text-[#589DF6] hover:text-[#7EB5FF] hover:underline transition-colors cursor-pointer"
          >
            Hủy và tạo mã mới
          </button>
        </div>
      ) : status === "APPROVED" ? (
        <div className="w-full max-w-[240px] flex flex-col items-center space-y-3 py-6 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[#2B66E0]/20 border border-[#589DF6]/50 text-[#589DF6] flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">
            Đăng nhập thành công
          </h3>
          <p className="text-xs text-[#B4B6BE]">Đang chuyển hướng...</p>
        </div>
      ) : (
        <>
          <div className="relative">
            {loading || !qrData ? (
              <div className="w-[180px] h-[180px] rounded-xl bg-[#1D1E22] border border-white/10 flex flex-col items-center justify-center gap-2 animate-pulse">
                <div className="w-6 h-6 rounded-full border-2 border-[#589DF6] border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="relative">
                <QrCodeSvg value={qrData.qrUrl} size={180} />

                {(status === "EXPIRED" || status === "REJECTED") && (
                  <div className="absolute inset-0 rounded-xl bg-[#1D1E22]/95 flex flex-col items-center justify-center p-3 gap-2.5 border border-white/15 animate-fade-in">
                    <span className="text-xs font-medium text-[#D1D3DA]">
                      Mã QR đã hết hạn
                    </span>
                    <button
                      type="button"
                      onClick={() => void initQrSession()}
                      className="text-xs px-4 py-1.5 rounded-full bg-[#2B66E0] hover:bg-[#3A75EE] text-white font-medium transition-colors cursor-pointer"
                    >
                      Tải lại mã
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-[#B4B6BE] mt-4 max-w-[260px] leading-relaxed">
            Mở camera hoặc trình duyệt trên thiết bị đã đăng nhập Bravechat để quét mã và phê duyệt.
          </p>
        </>
      )}
    </div>
  );
}
