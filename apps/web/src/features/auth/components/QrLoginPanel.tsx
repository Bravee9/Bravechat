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
    if (!qrData || status === "EXPIRED" || status === "REJECTED" || status === "APPROVED") {
      return;
    }
    const checkTimer = () => {
      const remain = Math.floor((new Date(qrData.expiresAt).getTime() - Date.now()) / 1000);
      if (remain <= 0) {
        setStatus("EXPIRED");
      }
    };
    const timer = setInterval(checkTimer, 1000);
    return () => clearInterval(timer);
  }, [qrData, status]);

  // Poll QR status
  useEffect(() => {
    if (!qrData || status === "EXPIRED" || status === "REJECTED" || status === "APPROVED") {
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
      className="flex flex-col items-center justify-center text-center select-none"
      data-testid="qr-login-panel"
    >
      {/* State: Scanned, waiting for mobile approval */}
      {status === "SCANNED" && scannedBy ? (
        <div className="w-full max-w-[220px] flex flex-col items-center space-y-4 py-4 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-ocean-primary border-2 border-ocean-secondary flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden">
            {scannedBy.avatarUrl ? (
              <img src={scannedBy.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (scannedBy.displayName?.[0] || scannedBy.username[0] || "B").toUpperCase()
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-ocean-secondary uppercase tracking-wider">
              Đã quét mã
            </p>
            <h4 className="text-base font-bold text-white mt-0.5">
              {scannedBy.displayName || scannedBy.username}
            </h4>
            <p className="text-xs text-ocean-light/60">@{scannedBy.username}</p>
          </div>

          <p className="text-xs text-ocean-light/70 leading-relaxed">
            Vui lòng xác nhận đăng nhập trên thiết bị của bạn để tiếp tục.
          </p>

          <button
            type="button"
            onClick={() => void initQrSession()}
            className="text-xs text-ocean-secondary hover:underline transition-colors cursor-pointer"
          >
            Hủy và tạo mã mới
          </button>
        </div>
      ) : status === "APPROVED" ? (
        <div className="w-full max-w-[220px] flex flex-col items-center space-y-3 py-8 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-ocean-primary/20 border border-ocean-secondary text-ocean-secondary flex items-center justify-center text-xl font-bold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-white">Đăng nhập thành công</h4>
          <p className="text-xs text-ocean-light/70">Đang chuyển tiếp...</p>
        </div>
      ) : (
        <>
          {/* White QR Code Square */}
          <div className="relative group">
            {loading || !qrData ? (
              <div className="w-[176px] h-[176px] rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 animate-pulse">
                <div className="w-6 h-6 rounded-full border-2 border-ocean-secondary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="relative">
                <QrCodeSvg value={qrData.qrUrl} size={176} />

                {(status === "EXPIRED" || status === "REJECTED") && (
                  <div className="absolute inset-0 rounded-lg bg-[#051424]/95 flex flex-col items-center justify-center p-3 gap-2 border border-white/10 animate-fade-in">
                    <span className="text-xs font-medium text-ocean-light/80">
                      Mã QR đã hết hạn
                    </span>
                    <button
                      type="button"
                      onClick={() => void initQrSession()}
                      className="text-xs px-3 py-1.5 rounded bg-ocean-primary hover:bg-ocean-primary/90 text-white font-medium transition-colors cursor-pointer"
                    >
                      Tải lại mã QR
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Heading and subtext matching Discord */}
          <h3 className="text-xl font-bold text-white mt-6 tracking-tight">
            Đăng nhập bằng mã QR
          </h3>
          <p className="text-sm text-ocean-light/70 mt-2 max-w-[220px] leading-relaxed">
            Quét mã này bằng ứng dụng di động để đăng nhập tức thì.
          </p>
        </>
      )}
    </div>
  );
}
