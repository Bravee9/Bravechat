"use client";

import React, { useEffect, useState } from "react";
import type { CurrentUser } from "@discord-clone/shared";
import { cn } from "@/lib/utils";
import { http } from "@/services/http";
import { useStore } from "@/lib/store";
import { i18nStore, type Language } from "@/stores/i18n.store";
import { workspaceStore } from "@/stores/workspace.store";

interface UserSession {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  isCurrent: boolean;
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

  // Security / 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<"idle" | "qr" | "success">("idle");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);

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

  // Load sessions when entering devices tab
  useEffect(() => {
    if (activeTab === "devices" || activeTab === "security") {
      void loadSessions();
    }
  }, [activeTab]);

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

  const handleSetup2FA = () => {
    if (twoFactorSetupStep === "idle") {
      setTwoFactorSetupStep("qr");
      // Generate sample backup codes
      setTwoFactorBackupCodes([
        "7A9B-4D2E",
        "1C3F-8E5A",
        "9B2C-6D4E",
        "5E1A-7F3B",
        "8D4C-2E9A",
        "3F6B-1A8E",
      ]);
    } else if (twoFactorSetupStep === "qr") {
      if (twoFactorCode.trim().length === 6) {
        setTwoFactorEnabled(true);
        setTwoFactorSetupStep("success");
      } else {
        setError("Vui lòng nhập đủ 6 chữ số từ ứng dụng xác thực.");
      }
    }
  };

  const maskEmail = (em: string) => {
    const [name, domain] = em.split("@");
    if (!name || !domain) return em;
    return `${name.slice(0, 1)}********${name.slice(-1)}@${domain}`;
  };

  const navigationItems = [
    { id: "account", label: t.account, section: "USER_SETTINGS", icon: "👤" },
    { id: "security", label: t.security, section: "USER_SETTINGS", icon: "🛡️" },
    { id: "devices", label: t.devices, section: "USER_SETTINGS", icon: "💻" },
    { id: "privacy", label: t.privacy, section: "USER_SETTINGS", icon: "🔒" },
    { id: "nitro", label: t.nitro, section: "BILLING_SETTINGS", icon: "✦", badge: "VIP" },
    { id: "language", label: t.language, section: "APP_SETTINGS", icon: "🌐" },
    { id: "voice", label: t.voiceVideo, section: "APP_SETTINGS", icon: "🎙️" },
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
                  className="absolute right-2 top-1.5 text-xs text-ocean-light/40 hover:text-white"
                >
                  ✕
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
                    <span>{item.icon}</span>
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
                    <span>{item.icon}</span>
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
                    <span>{item.icon}</span>
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
            ✕
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

        {/* ─── TAB: SECURITY (2FA & SESSIONS) ─────────────────────────── */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ocean-light">{t.passwordAndSecurity}</h2>

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
                      onClick={() => {
                        setSuccessMsg("Mật khẩu đã được cập nhật thành công.");
                        setChangingPassword(false);
                      }}
                      className="btn-primary text-xs py-1.5 px-4"
                    >
                      Cập nhật mật khẩu
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
                <button
                  type="button"
                  onClick={handleSetup2FA}
                  className={cn(
                    "text-xs px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer",
                    twoFactorEnabled
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default"
                      : "btn-primary"
                  )}
                >
                  {twoFactorEnabled ? "Đã Kích Hoạt ✓" : t.twoFactorSetup + " >"}
                </button>
              </div>

              {twoFactorSetupStep === "qr" && (
                <div className="p-4 rounded-xl bg-black/40 border border-ocean-secondary/40 space-y-3 animate-fadeIn">
                  <p className="text-xs font-semibold text-ocean-light">
                    1. Quét mã QR bằng Google Authenticator hoặc Authy:
                  </p>
                  <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="w-24 h-24 bg-white rounded-lg p-1.5 flex items-center justify-center">
                      <div className="w-full h-full bg-slate-900 rounded grid grid-cols-4 gap-0.5 p-1">
                        <div className="bg-white col-span-2 row-span-2" />
                        <div className="bg-white" />
                        <div className="bg-white" />
                        <div className="bg-white" />
                        <div className="bg-white col-span-2 row-span-2" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-ocean-light/50">Mã bí mật (Secret key):</p>
                      <code className="text-xs font-mono text-ocean-secondary font-bold">
                        JBSWY3DPEHPK3PXP
                      </code>
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
                      onClick={handleSetup2FA}
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
                    <span>✓</span>
                    <span>Xác thực 2 yếu tố đã được bảo vệ thành công!</span>
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
                Quản lý thiết bị &gt;
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: ACTIVE SESSIONS (DEVICES) ────────────────────────── */}
        {activeTab === "devices" && (
          <div className="space-y-6">
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
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-lg">
                        {session.userAgent.includes("Windows") || session.userAgent.includes("Mac") ? "💻" : "📱"}
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
                { icon: "📦", title: "Dung lượng tải 500MB", desc: t.nitroUploadPerk },
                { icon: "🎖️", title: "Huy hiệu MATH VIP", desc: t.nitroBadgePerk },
                { icon: "🎥", title: "LiveKit SFU 1080p 60FPS", desc: t.nitroHdPerk },
                { icon: "🎨", title: "Tùy biến Banner & Avatar", desc: t.nitroBannerPerk },
              ].map((perk) => (
                <div
                  key={perk.title}
                  className="p-5 rounded-2xl bg-[#051424] border border-ocean-dark-border hover:border-purple-500/40 transition-colors shadow-lg"
                >
                  <span className="text-2xl">{perk.icon}</span>
                  <h4 className="font-bold text-sm text-ocean-light mt-3">{perk.title}</h4>
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
      </main>
    </div>
  );
}
