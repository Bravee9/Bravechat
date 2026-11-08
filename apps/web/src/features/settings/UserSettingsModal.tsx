"use client";

import React, { useEffect, useState } from "react";
import type { CurrentUser } from "@discord-clone/shared";
import { cn } from "@/lib/utils";
import { http } from "@/services/http";
import { useStore } from "@/lib/store";
import { i18nStore, type Language } from "@/stores/i18n.store";
import { workspaceStore } from "@/stores/workspace.store";
import { QrCodeSvg } from "@/components/ui/QrCodeSvg";
import { GmailSmtpModal } from "@/features/auth/components/GmailSmtpModal";

interface UserSession {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  isCurrent: boolean;
}

interface SecurityLogItem {
  id: string;
  event: string;
  method: string;
  status: "SUCCESS" | "CHALLENGE" | "FAILED";
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface UserSettingsModalProps {
  user: CurrentUser;
  initialTab?: string;
  onClose: () => void;
  onSaved: (user: CurrentUser) => void;
}

export function UserSettingsModal({
  user,
  initialTab = "account",
  onClose,
  onSaved,
}: UserSettingsModalProps) {
  const { lang, t, setLanguage } = useStore(i18nStore, (s) => s);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Account Form state
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Security / 2FA / Gmail state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<"idle" | "qr" | "success">("idle");
  const [twoFactorSecret, setTwoFactorSecret] = useState("JBSWY3DPEHPK3PXP");
  const [twoFactorOtpauthUrl, setTwoFactorOtpauthUrl] = useState("");
  const [twoFactorDevCode, setTwoFactorDevCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [gmailLoginOtpEnabled, setGmailLoginOtpEnabled] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(Boolean(user.isEmailVerified));
  const [emailVerifyStep, setEmailVerifyStep] = useState<"idle" | "otp">("idle");
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [emailVerifyDevOtp, setEmailVerifyDevOtp] = useState("");
  const [securityLogs, setSecurityLogs] = useState<SecurityLogItem[]>([]);
  const [showGmailSmtpModal, setShowGmailSmtpModal] = useState(false);

  // QR Remote Device Approval state
  const [qrInputCode, setQrInputCode] = useState("");
  const [qrScannedDevice, setQrScannedDevice] = useState<{
    qrId: string;
    shortCode: string;
    device: { ipAddress: string; userAgent: string };
  } | null>(null);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Voice & Video test
  const [micTesting, setMicTesting] = useState(false);
  const [micVolume, setMicVolume] = useState(65);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load sessions & security state when entering devices or security tab
  useEffect(() => {
    if (activeTab === "devices" || activeTab === "security") {
      void loadSessions();
      void loadSecurityInfo();
    }
  }, [activeTab]);

  const loadSecurityInfo = async () => {
    try {
      const res = await http.get<{
        isEmailVerified: boolean;
        twoFactorEnabled: boolean;
        gmailLoginOtpEnabled: boolean;
        logs: SecurityLogItem[];
      }>("/auth/security");
      setIsEmailVerified(res.isEmailVerified);
      setTwoFactorEnabled(res.twoFactorEnabled);
      setGmailLoginOtpEnabled(res.gmailLoginOtpEnabled);
      setSecurityLogs(res.logs || []);
    } catch {
      // ignore
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await http.get<{ sessions: UserSession[] }>("/auth/sessions");
      setSessions(res.sessions);
    } catch {
      // Fallback demo session if API error
      setSessions([
        {
          id: "curr_session",
          userAgent: navigator.userAgent || "Chrome · Windows",
          ipAddress: "127.0.0.1 (IP Hiện tại)",
          createdAt: new Date().toISOString(),
          isCurrent: true,
        },
      ]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (id: string) => {
    try {
      await http.delete(`/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setSuccessMsg("Đã thu hồi phiên đăng nhập thành công.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Không thể thu hồi phiên đăng nhập.");
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await http.patch<{ user: CurrentUser }>("/users/@me", {
        username,
        displayName: displayName || null,
        bio: bio || null,
      });
      onSaved(res.user);
      workspaceStore.set({ currentUser: res.user });
      setEditingField(null);
      setSuccessMsg("Đã lưu thông tin tài khoản thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setBusy(false);
    }
  };

  const handleUploadAsset = async (field: "avatar" | "banner", file?: File) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file, file.name);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/users/@me/${field}`,
        { method: "POST", credentials: "include", body: form }
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Không thể tải ảnh lên.");
      onSaved(body.data.user as CurrentUser);
      workspaceStore.set({ currentUser: body.data.user as CurrentUser });
      setSuccessMsg(`Đã cập nhật ${field === "avatar" ? "ảnh đại diện" : "ảnh nền"}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải ảnh lên.");
    } finally {
      setBusy(false);
    }
  };

  const handleSetup2FA = async () => {
    setError("");
    if (twoFactorSetupStep === "idle") {
      try {
        const res = await http.post<{
          secret: string;
          otpauthUrl: string;
          devCurrentCode?: string;
        }>("/auth/2fa/setup");
        setTwoFactorSecret(res.secret);
        setTwoFactorOtpauthUrl(res.otpauthUrl);
        if (res.devCurrentCode) setTwoFactorDevCode(res.devCurrentCode);
        setTwoFactorSetupStep("qr");
      } catch {
        setTwoFactorSetupStep("qr");
      }
    } else if (twoFactorSetupStep === "qr") {
      if (twoFactorCode.trim().length !== 6) {
        setError("Vui lòng nhập đủ 6 chữ số từ ứng dụng xác thực.");
        return;
      }
      try {
        const res = await http.post<{
          twoFactorEnabled: boolean;
          backupCodes: string[];
        }>("/auth/2fa/enable", { code: twoFactorCode.trim() });
        setTwoFactorEnabled(res.twoFactorEnabled);
        setTwoFactorBackupCodes(res.backupCodes);
        setTwoFactorSetupStep("success");
        void loadSecurityInfo();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Mã xác thực 2FA không hợp lệ.");
      }
    }
  };

  const handleToggleGmailLoginOtp = async (nextVal: boolean) => {
    setError("");
    try {
      const res = await http.post<{ gmailLoginOtpEnabled: boolean }>("/auth/security/preferences", {
        gmailLoginOtpEnabled: nextVal,
      });
      setGmailLoginOtpEnabled(res.gmailLoginOtpEnabled);
      setSuccessMsg(
        res.gmailLoginOtpEnabled
          ? "Đã bật xác minh đăng nhập bước 2 qua Gmail (OTP 6 chữ số)!"
          : "Đã tắt yêu cầu xác minh Gmail OTP bắt buộc khi đăng nhập."
      );
      setTimeout(() => setSuccessMsg(""), 3000);
      void loadSecurityInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật cài đặt bảo mật.");
    }
  };

  const handleSendVerifyEmailOtp = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await http.post<{ delivery: string; devOtp?: string }>("/auth/verify-email/send");
      setEmailVerifyStep("otp");
      if (res.devOtp) setEmailVerifyDevOtp(res.devOtp);
      setSuccessMsg("Đã gửi mã xác minh 6 chữ số tới hộp thư Gmail của bạn.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi mã xác minh Gmail.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmVerifyEmailOtp = async () => {
    if (emailVerifyCode.trim().length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const res = await http.post<{ user: CurrentUser }>("/auth/verify-email/confirm", {
        code: emailVerifyCode.trim(),
      });
      setIsEmailVerified(true);
      setEmailVerifyStep("idle");
      onSaved(res.user);
      workspaceStore.set({ currentUser: res.user });
      setSuccessMsg("Đã xác minh địa chỉ Gmail chính chủ thành công!");
      setTimeout(() => setSuccessMsg(""), 4000);
      void loadSecurityInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã xác minh Gmail không chính xác.");
    } finally {
      setBusy(false);
    }
  };

  const handleChangePasswordReal = async () => {
    setError("");
    if (!currentPassword || newPassword.length < 8) {
      setError("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới tối thiểu 8 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu mới xác nhận chưa trùng khớp.");
      return;
    }
    setBusy(true);
    try {
      await http.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccessMsg("Mật khẩu đã được cập nhật thành công và các thiết bị khác đã được đăng xuất.");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setSuccessMsg(""), 4000);
      void loadSecurityInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi mật khẩu.");
    } finally {
      setBusy(false);
    }
  };

  const handleScanQrDevice = async () => {
    if (!qrInputCode.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await http.post<{
        qrId: string;
        shortCode: string;
        device: { ipAddress: string; userAgent: string };
      }>("/auth/qr/scan", { code: qrInputCode.trim() });
      setQrScannedDevice(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã QR không tồn tại hoặc đã hết hạn.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveQrDevice = async () => {
    if (!qrScannedDevice) return;
    setBusy(true);
    setError("");
    try {
      await http.post("/auth/qr/approve", { qrId: qrScannedDevice.qrId });
      setSuccessMsg(`Đã phê duyệt đăng nhập bằng mã QR (${qrScannedDevice.shortCode}) thành công!`);
      setQrScannedDevice(null);
      setQrInputCode("");
      void loadSessions();
      void loadSecurityInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phê duyệt thiết bị QR.");
    } finally {
      setBusy(false);
    }
  };

  const maskEmail = (em: string) => {
    const [name, domain] = em.split("@");
    if (!name || !domain) return em;
    return `${name.slice(0, 1)}********${name.slice(-1)}@${domain}`;
  };

  const navigationItems = [
    { id: "account", label: t.account, section: "USER_SETTINGS" },
    { id: "security", label: t.security, section: "USER_SETTINGS" },
    { id: "devices", label: t.devices, section: "USER_SETTINGS" },
    { id: "privacy", label: t.privacy, section: "USER_SETTINGS" },
    { id: "nitro", label: t.nitro, section: "BILLING_SETTINGS", badge: "VIP" },
    { id: "language", label: t.language, section: "APP_SETTINGS" },
    { id: "voice", label: t.voiceVideo, section: "APP_SETTINGS" },
  ];

  const filteredNav = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex bg-black/80 backdrop-blur-md overflow-hidden animate-fadeIn select-none"
      data-testid="user-settings-modal"
    >
      {/* Left Sidebar (30%) */}
      <aside className="w-64 md:w-72 bg-[#051424] border-r border-ocean-dark-border flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* User mini badge & Search */}
          <div className="mb-4">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 mb-3">
              <div className="w-10 h-10 rounded-full bg-ocean-primary flex items-center justify-center font-bold text-white text-sm shadow-ocean-glow">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (user.displayName?.[0] || user.username[0] || "B").toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-ocean-light truncate leading-tight">
                  {user.displayName || user.username}
                </p>
                <p className="text-xs text-ocean-light/50 font-mono">@{user.username}</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#071A2C] border border-ocean-dark-border rounded-lg px-3 py-1.5 text-xs text-ocean-light placeholder:text-ocean-light/40 focus:outline-none focus:border-ocean-secondary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-ocean-light/40 hover:text-white"
                  aria-label="Xóa tìm kiếm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Nav Categories */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-ocean-light/40 uppercase px-3 py-1">
              Cài Đặt Người Dùng
            </div>
            {filteredNav
              .filter((i) => i.section === "USER_SETTINGS")
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left",
                    activeTab === item.id
                      ? "bg-ocean-primary text-white shadow-ocean-glow"
                      : "text-ocean-light/75 hover:bg-white/5 hover:text-ocean-light"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}

            <div className="text-[10px] font-bold tracking-wider text-ocean-light/40 uppercase px-3 pt-3 py-1">
              Tính Năng Cao Cấp
            </div>
            {filteredNav
              .filter((i) => i.section === "BILLING_SETTINGS")
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left",
                    activeTab === item.id
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-purple-300 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-purple-500/30 text-purple-200 border border-purple-500/50 text-[9px] px-1.5 py-0.2 rounded font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

            <div className="text-[10px] font-bold tracking-wider text-ocean-light/40 uppercase px-3 pt-3 py-1">
              Cài Đặt Ứng Dụng
            </div>
            {filteredNav
              .filter((i) => i.section === "APP_SETTINGS")
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left",
                    activeTab === item.id
                      ? "bg-ocean-primary text-white shadow-ocean-glow"
                      : "text-ocean-light/75 hover:bg-white/5 hover:text-ocean-light"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
          </nav>
        </div>

        {/* Logout bottom button */}
        <div className="pt-4 border-t border-ocean-dark-border/40">
          <button
            type="button"
            onClick={async () => {
              try {
                await http.post("/auth/logout");
                window.location.href = "/login";
              } catch {
                window.location.href = "/login";
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <span>⏻</span>
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Right Content Area (70%) */}
      <main className="flex-1 bg-[#071A2C] overflow-y-auto p-8 relative max-w-4xl">
        {/* ESC Close button in top-right */}
        <div className="absolute top-6 right-8 flex flex-col items-center">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-ocean-dark-border hover:border-ocean-secondary bg-[#051424] text-ocean-light hover:text-white flex items-center justify-center transition-colors text-sm font-bold shadow-md cursor-pointer"
            aria-label="Đóng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-[10px] text-ocean-light/40 font-mono mt-1">ESC</span>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs animate-shake">
            {error}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mb-6 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs">
            {successMsg}
          </div>
        )}

        {/* ─── TAB: ACCOUNT ────────────────────────────────────────── */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ocean-light">{t.accountInfo}</h2>

            {/* Profile Card Preview */}
            <div className="rounded-2xl border border-ocean-dark-border bg-[#051424] overflow-hidden shadow-xl">
              {/* Banner Area */}
              <div className="h-32 bg-gradient-to-r from-ocean-primary/70 via-ocean-secondary/50 to-blue-900 relative group">
                {user.bannerUrl && (
                  <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                )}
                <label className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer border border-white/10 transition-all font-medium">
                  {t.banner}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => void handleUploadAsset("banner", e.target.files?.[0])}
                  />
                </label>
              </div>

              {/* Avatar + Primary Info */}
              <div className="px-6 pb-6 pt-0 relative">
                <div className="flex justify-between items-end -mt-12 mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-[#051424] bg-ocean-dark-surface overflow-hidden shadow-2xl flex items-center justify-center font-bold text-2xl text-ocean-secondary">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user.displayName?.[0] || user.username[0] || "B").toUpperCase()
                      )}
                    </div>
                    <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer transition-opacity">
                      Đổi ảnh
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => void handleUploadAsset("avatar", e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === "profile" ? null : "profile")}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    {editingField === "profile" ? t.cancel : t.edit + " Hồ Sơ"}
                  </button>
                </div>

                {/* Account Details Box */}
                <div className="bg-[#071A2C] rounded-xl p-4 border border-ocean-dark-border/80 space-y-4">
                  {/* Tên đăng nhập */}
                  <div className="flex items-center justify-between pb-3 border-b border-ocean-dark-border/40">
                    <div>
                      <p className="text-[11px] text-ocean-light/50 font-semibold uppercase">{t.username}</p>
                      <p className="text-sm font-medium text-ocean-light font-mono">@{username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingField("username")}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      {t.edit}
                    </button>
                  </div>

                  {/* Tên hiển thị */}
                  <div className="flex items-center justify-between pb-3 border-b border-ocean-dark-border/40">
                    <div>
                      <p className="text-[11px] text-ocean-light/50 font-semibold uppercase">{t.displayName}</p>
                      <p className="text-sm font-medium text-ocean-light">{displayName || "Chưa thiết lập"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingField("displayName")}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      {t.edit}
                    </button>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between pb-3 border-b border-ocean-dark-border/40">
                    <div>
                      <p className="text-[11px] text-ocean-light/50 font-semibold uppercase">{t.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-medium text-ocean-light font-mono">
                          {showEmail ? user.email : maskEmail(user.email)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowEmail(!showEmail)}
                          className="text-xs text-ocean-secondary hover:underline cursor-pointer"
                        >
                          {showEmail ? t.hide : t.show}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="text-xs text-ocean-light/30 px-3 py-1.5 cursor-not-allowed"
                      title="Email cố định theo tài khoản"
                    >
                      {t.edit}
                    </button>
                  </div>

                  {/* Số điện thoại */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-ocean-light/50 font-semibold uppercase">{t.phone}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-medium text-ocean-light font-mono">
                          {showPhone ? "0987 653 198" : "********3198"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPhone(!showPhone)}
                          className="text-xs text-ocean-secondary hover:underline cursor-pointer"
                        >
                          {showPhone ? t.hide : t.show}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingField("phone")}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      {t.edit}
                    </button>
                  </div>
                </div>

                {/* Inline Editing Form */}
                {editingField && (
                  <form onSubmit={handleSaveProfile} className="mt-4 p-4 rounded-xl bg-black/30 border border-ocean-secondary/40 space-y-3 animate-fadeIn">
                    <p className="text-xs font-semibold text-ocean-secondary">Cập nhật thông tin</p>
                    {editingField === "username" && (
                      <label className="block text-xs">
                        {t.username}
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="input-ocean mt-1 w-full text-xs"
                        />
                      </label>
                    )}
                    {editingField === "displayName" && (
                      <label className="block text-xs">
                        {t.displayName}
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="input-ocean mt-1 w-full text-xs"
                        />
                      </label>
                    )}
                    {editingField === "profile" && (
                      <div className="space-y-3">
                        <label className="block text-xs">
                          {t.displayName}
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="input-ocean mt-1 w-full text-xs"
                          />
                        </label>
                        <label className="block text-xs">
                          {t.bio}
                          <textarea
                            value={bio}
                            maxLength={190}
                            rows={3}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Chia sẻ vài điều thú vị về bạn..."
                            className="input-ocean mt-1 w-full text-xs"
                          />
                        </label>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="btn-primary text-xs py-1.5 px-4"
                      >
                        {busy ? "Đang lưu..." : t.save}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: SECURITY (2FA, GMAIL OTP, QR & SESSIONS) ─────────────── */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-ocean-light">{t.passwordAndSecurity}</h2>
              <button
                type="button"
                onClick={() => setShowGmailSmtpModal(true)}
                className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <span>Cấu hình Gmail SMTP</span>
              </button>
            </div>

            {/* Gmail Account Verification & 2-Step Login OTP Card */}
            <div className="rounded-2xl border border-ocean-dark-border bg-[#051424] p-6 space-y-4 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-ocean-light">
                      Xác minh địa chỉ Gmail & Bảo mật đăng nhập
                    </h3>
                    {isEmailVerified ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                        Đã xác minh Gmail
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                        Chưa xác minh
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ocean-light/60 mt-1">
                    Địa chỉ liên kết: <strong className="font-mono text-ocean-light">{user.email}</strong>
                  </p>
                </div>

                {!isEmailVerified && emailVerifyStep === "idle" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSendVerifyEmailOtp}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Gửi mã xác minh Gmail
                  </button>
                )}
              </div>

              {emailVerifyStep === "otp" && (
                <div className="p-4 rounded-xl bg-black/40 border border-ocean-secondary/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ocean-light">
                      Nhập mã 6 chữ số đã gửi tới <strong>{user.email}</strong>:
                    </span>
                    {emailVerifyDevOtp && (
                      <button
                        type="button"
                        onClick={() => setEmailVerifyCode(emailVerifyDevOtp)}
                        className="font-mono text-emerald-300 hover:underline cursor-pointer"
                      >
                        Mã Dev: <strong>{emailVerifyDevOtp}</strong> (Điền nhanh)
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={emailVerifyCode}
                      onChange={(e) => setEmailVerifyCode(e.target.value.replace(/\D/g, ""))}
                      className="input-ocean w-36 text-center font-mono text-base font-bold tracking-widest"
                    />
                    <button
                      type="button"
                      disabled={busy || emailVerifyCode.length !== 6}
                      onClick={handleConfirmVerifyEmailOtp}
                      className="btn-primary text-xs px-4"
                    >
                      Xác nhận Gmail
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-ocean-dark-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-ocean-light">
                    Bắt buộc xác minh Mã OTP qua Gmail mỗi khi đăng nhập (2-Step Gmail Verification)
                  </p>
                  <p className="text-[11px] text-ocean-light/55 mt-0.5">
                    Khi bật, mọi lần đăng nhập bằng mật khẩu đều yêu cầu nhập mã 6 số gửi về Gmail của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleGmailLoginOtp(!gmailLoginOtpEnabled)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    gmailLoginOtpEnabled
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50"
                      : "btn-secondary"
                  )}
                >
                  {gmailLoginOtpEnabled ? "Đang bật" : "Bật ngay"}
                </button>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="rounded-2xl border border-ocean-dark-border bg-[#051424] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-ocean-light">{t.password}</h3>
                  <p className="text-xs text-ocean-light/50 font-mono mt-0.5">••••••••••••••••</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChangingPassword(!changingPassword)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  {changingPassword ? t.cancel : t.changePassword}
                </button>
              </div>

              {changingPassword && (
                <div className="pt-3 border-t border-ocean-dark-border/40 space-y-3">
                  <input
                    type="password"
                    placeholder="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-ocean w-full text-xs"
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-ocean w-full text-xs"
                  />
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input-ocean w-full text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setChangingPassword(false)}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleChangePasswordReal()}
                      className="btn-primary text-xs py-1.5 px-4"
                    >
                      {busy ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2FA Card */}
            <div className="rounded-2xl border border-ocean-dark-border bg-[#051424] p-6 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-ocean-light">{t.twoFactorAuth}</h3>
                  <p className="text-xs text-ocean-light/60 mt-1 max-w-md">{t.twoFactorDesc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSetup2FA()}
                    className={cn(
                      "text-xs px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer",
                      twoFactorEnabled
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default"
                        : "btn-primary"
                    )}
                  >
                    {twoFactorEnabled ? "Đã kích hoạt" : t.twoFactorSetup}
                  </button>
                  {twoFactorEnabled && (
                    <button
                      type="button"
                      onClick={async () => {
                        await http.post("/auth/2fa/disable").catch(() => undefined);
                        setTwoFactorEnabled(false);
                        setTwoFactorSetupStep("idle");
                        void loadSecurityInfo();
                      }}
                      className="text-xs text-rose-400 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Tắt 2FA
                    </button>
                  )}
                </div>
              </div>

              {twoFactorSetupStep === "qr" && (
                <div className="p-4 rounded-xl bg-black/40 border border-ocean-secondary/40 space-y-3 animate-fadeIn">
                  <p className="text-xs font-semibold text-ocean-light">
                    1. Quét mã QR chuẩn TOTP bằng Google Authenticator hoặc Authy:
                  </p>
                  <div className="flex flex-wrap items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                    <QrCodeSvg
                      value={
                        twoFactorOtpauthUrl ||
                        `otpauth://totp/Bravechat:${user.email}?secret=${twoFactorSecret}&issuer=Bravechat`
                      }
                      size={112}
                      showCenterLogo={false}
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-ocean-light/50">Mã bí mật (Secret key):</p>
                      <code className="text-xs font-mono text-ocean-secondary font-bold block">
                        {twoFactorSecret}
                      </code>
                      {twoFactorDevCode && (
                        <button
                          type="button"
                          onClick={() => setTwoFactorCode(twoFactorDevCode)}
                          className="text-[11px] font-mono text-emerald-300 hover:underline cursor-pointer block pt-1"
                        >
                          Mã TOTP hiện tại: <strong>{twoFactorDevCode}</strong> (Điền nhanh)
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-ocean-light pt-2">
                    2. Nhập mã xác thực 6 chữ số:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                      className="input-ocean w-36 text-center font-mono text-lg tracking-widest font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSetup2FA()}
                      className="btn-primary text-xs px-4"
                    >
                      Xác nhận kích hoạt
                    </button>
                  </div>
                </div>
              )}

              {twoFactorSetupStep === "success" && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Xác thực 2 yếu tố đã được kích hoạt thành công!</span>
                  </div>
                  <p className="text-xs text-ocean-light/70">
                    Lưu lại 6 mã dự phòng này để đăng nhập khi mất điện thoại:
                  </p>
                  <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-lg font-mono text-xs text-ocean-secondary text-center">
                    {twoFactorBackupCodes.map((code) => (
                      <span key={code} className="bg-white/5 py-1 rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Security Audit Logs Card */}
            {securityLogs.length > 0 && (
              <div className="rounded-2xl border border-ocean-dark-border bg-[#051424] p-6 space-y-3 shadow-xl">
                <h3 className="font-bold text-sm text-ocean-light">
                  Nhật ký hoạt động bảo mật gần đây
                </h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {securityLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-ocean-light">{log.event}</p>
                        <p className="text-[11px] font-mono text-ocean-light/50 mt-0.5">
                          IP: {log.ipAddress} · {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : log.status === "CHALLENGE"
                              ? "bg-ocean-secondary/20 text-ocean-secondary"
                              : "bg-rose-500/20 text-rose-300"
                        )}
                      >
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Link to Devices */}
            <div className="rounded-2xl border border-ocean-dark-border bg-[#051424] p-6 flex items-center justify-between shadow-xl">
              <div>
                <h3 className="font-bold text-sm text-ocean-light">{t.activeSessions}</h3>
                <p className="text-xs text-ocean-light/50 mt-0.5">
                  Đang có {sessions.length || 1} thiết bị đăng nhập vào tài khoản này
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("devices")}
                className="btn-secondary text-xs px-4 py-2"
              >
                Quản lý thiết bị & Phê duyệt QR &gt;
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: ACTIVE SESSIONS (DEVICES) & QR APPROVAL ─────────── */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            {/* Remote QR Code Approval Card */}
            <div className="rounded-2xl border border-ocean-secondary/40 bg-[#051424] p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="font-bold text-sm text-ocean-light">
                  Phê duyệt Đăng nhập bằng Mã QR cho Thiết bị mới
                </h3>
                <p className="text-xs text-ocean-light/60 mt-1">
                  Nhập mã nhanh (ví dụ <code className="text-ocean-secondary">BC-8F3A2C</code>) hiển thị bên dưới mã QR trên màn hình đăng nhập máy tính hoặc trình duyệt khác.
                </p>
              </div>

              {!qrScannedDevice ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã BC-XXXXXX hoặc dán link QR"
                    value={qrInputCode}
                    onChange={(e) => setQrInputCode(e.target.value)}
                    className="input-ocean flex-1 font-mono text-xs uppercase"
                  />
                  <button
                    type="button"
                    disabled={busy || !qrInputCode.trim()}
                    onClick={() => void handleScanQrDevice()}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Kiểm tra thiết bị
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black/40 border border-ocean-secondary/50 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ocean-secondary">
                      Thiết bị chờ phê duyệt ({qrScannedDevice.shortCode})
                    </span>
                    <span className="font-mono text-white">IP: {qrScannedDevice.device.ipAddress}</span>
                  </div>
                  <p className="text-xs text-ocean-light/75 truncate">
                    Trình duyệt: {qrScannedDevice.device.userAgent}
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setQrScannedDevice(null)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleApproveQrDevice()}
                      className="btn-primary text-xs px-4 py-1.5 font-bold"
                    >
                      Phê duyệt đăng nhập ngay
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ocean-light">{t.devices}</h2>
                <p className="text-xs text-ocean-light/50 mt-1">
                  Kiểm tra các phiên đăng nhập và đăng xuất từ xa khỏi các thiết bị đáng ngờ
                </p>
              </div>
              {sessions.filter((s) => !s.isCurrent).length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    for (const s of sessions.filter((s) => !s.isCurrent)) {
                      await revokeSession(s.id);
                    }
                  }}
                  className="btn-secondary text-xs px-3 py-1.5 text-rose-300 hover:text-rose-200"
                >
                  {t.logOutOtherSessions}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {loadingSessions ? (
                <p className="text-xs text-ocean-light/50">Đang tải danh sách thiết bị...</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "rounded-xl border p-4 flex items-center justify-between bg-[#051424]",
                      session.isCurrent ? "border-ocean-secondary/60 shadow-ocean-glow" : "border-ocean-dark-border"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-ocean-light/70">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-ocean-light">
                            {session.userAgent.slice(0, 36)}...
                          </p>
                          {session.isCurrent && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              {t.currentDevice}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ocean-light/50 font-mono mt-0.5">
                          {session.ipAddress} · Hoạt động: {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => revokeSession(session.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
                      >
                        Đăng xuất
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: BRAVE NITRO ──────────────────────────────────────── */}
        {activeTab === "nitro" && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-purple-900/60 via-[#071A2C] to-ocean-dark-surface border border-purple-500/30 p-8 shadow-2xl relative overflow-hidden">
              <div className="max-w-md relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full text-purple-300 text-xs font-bold">
                  <span>✦</span>
                  <span>BRAVE NITRO</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {t.nitroTitle}
                </h2>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  {t.nitroSubtitle}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMsg("Bạn đã đăng ký Brave Nitro thành công!");
                    setTimeout(() => setSuccessMsg(""), 3000);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-900/50 transition-all cursor-pointer"
                >
                  {t.nitroSubscribe}
                </button>
              </div>

              {/* Decorative elements */}
              <div className="absolute right-6 top-6 opacity-20 text-9xl pointer-events-none">
                ✦
              </div>
            </div>

            {/* Perks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Dung lượng tải 500MB", desc: t.nitroUploadPerk },
                { title: "Huy hiệu MATH VIP", desc: t.nitroBadgePerk },
                { title: "LiveKit SFU 1080p 60FPS", desc: t.nitroHdPerk },
                { title: "Tùy biến Banner & Avatar", desc: t.nitroBannerPerk },
              ].map((perk) => (
                <div
                  key={perk.title}
                  className="p-5 rounded-2xl bg-[#051424] border border-ocean-dark-border hover:border-purple-500/40 transition-colors shadow-lg"
                >
                  <h4 className="font-bold text-sm text-ocean-light">{perk.title}</h4>
                  <p className="text-xs text-ocean-light/60 mt-1 leading-relaxed">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: LANGUAGE ─────────────────────────────────────────── */}
        {activeTab === "language" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-ocean-light">{t.language}</h2>
              <p className="text-xs text-ocean-light/50 mt-1">
                Chọn ngôn ngữ giao diện ưa thích cho tài khoản của bạn
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { code: "vi", label: "Tiếng Việt (Mặc định)", flag: "🇻🇳", desc: "Giao diện đầy đủ tiếng Việt" },
                  { code: "en", label: "English (US)", flag: "🇺🇸", desc: "Full English professional interface" },
                ] as const
              ).map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code as Language)}
                  className={cn(
                    "p-5 rounded-2xl border text-left transition-all cursor-pointer",
                    lang === l.code
                      ? "bg-ocean-primary/20 border-ocean-secondary shadow-ocean-glow"
                      : "bg-[#051424] border-ocean-dark-border hover:bg-white/5"
                  )}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <p className="font-bold text-sm text-ocean-light mt-3">{l.label}</p>
                  <p className="text-xs text-ocean-light/50 mt-1">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: VOICE & VIDEO ────────────────────────────────────── */}
        {activeTab === "voice" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-ocean-light">{t.voiceVideo}</h2>
              <p className="text-xs text-ocean-light/50 mt-1">
                Cấu hình Microphone, Tai nghe và thử nghiệm âm lượng thoại
              </p>
            </div>

            <div className="rounded-2xl border border-ocean-dark-border bg-[#051424] p-6 space-y-4">
              <label className="block text-xs font-semibold text-ocean-light">
                Thiết bị đầu vào (Microphone)
                <select className="input-ocean mt-1.5 w-full text-xs">
                  <option>Microphone mặc định (Default Audio Device)</option>
                  <option>Headset Microphone (Realtek Audio)</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-ocean-light">
                Thiết bị đầu ra (Speakers / Headphone)
                <select className="input-ocean mt-1.5 w-full text-xs">
                  <option>Loa ngoài mặc định (Speakers)</option>
                  <option>Headphones (Realtek Audio)</option>
                </select>
              </label>

              {/* Mic Test Bar */}
              <div className="pt-3 border-t border-ocean-dark-border/40">
                <p className="text-xs font-semibold text-ocean-light mb-2">Thử nghiệm Microphone</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setMicTesting(!micTesting)}
                    className={cn(
                      "text-xs px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer",
                      micTesting ? "btn-secondary text-rose-300" : "btn-primary"
                    )}
                  >
                    {micTesting ? "Dừng thử mic" : "Bắt đầu thử mic"}
                  </button>

                  <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-ocean-dark-border/40">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-150",
                        micTesting ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 animate-pulse" : "bg-ocean-primary/30"
                      )}
                      style={{ width: micTesting ? `${micVolume}%` : "10%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showGmailSmtpModal && (
          <GmailSmtpModal onClose={() => setShowGmailSmtpModal(false)} />
        )}
      </main>
    </div>
  );
}
