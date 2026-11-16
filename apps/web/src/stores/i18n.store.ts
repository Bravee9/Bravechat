"use client";

import { createStore } from "@/lib/store";

export type Language = "vi" | "en";

export interface I18nTranslations {
  // Navigation & General
  account: string;
  security: string;
  devices: string;
  privacy: string;
  nitro: string;
  language: string;
  voiceVideo: string;
  logout: string;
  search: string;
  close: string;
  save: string;
  cancel: string;
  edit: string;

  // Account Info
  accountInfo: string;
  username: string;
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  banner: string;
  show: string;
  hide: string;

  // Security
  passwordAndSecurity: string;
  password: string;
  changePassword: string;
  twoFactorAuth: string;
  twoFactorDesc: string;
  twoFactorSetup: string;
  activeSessions: string;
  logOutOtherSessions: string;
  currentDevice: string;

  // Nitro
  nitroTitle: string;
  nitroSubtitle: string;
  nitroUploadPerk: string;
  nitroBadgePerk: string;
  nitroHdPerk: string;
  nitroBannerPerk: string;
  nitroSubscribe: string;

  // Status
  online: string;
  idle: string;
  dnd: string;
  invisible: string;
  offline: string;
}

const translations: Record<Language, I18nTranslations> = {
  vi: {
    account: "Tài Khoản",
    security: "Mật Khẩu & Bảo Mật",
    devices: "Thiết Bị Đã Đăng Nhập",
    privacy: "Dữ Liệu & Bảo Mật",
    nitro: "Brave Nitro",
    language: "Ngôn Ngữ",
    voiceVideo: "Giọng Nói & Video",
    logout: "Đăng Xuất",
    search: "Tìm kiếm cài đặt...",
    close: "Đóng (ESC)",
    save: "Lưu thay đổi",
    cancel: "Hủy",
    edit: "Chỉnh sửa",

    accountInfo: "Thông Tin Tài Khoản",
    username: "Tên đăng nhập",
    displayName: "Tên hiển thị",
    email: "Email",
    phone: "Số điện thoại",
    bio: "Giới thiệu bản thân",
    avatar: "Ảnh đại diện",
    banner: "Ảnh nền hồ sơ",
    show: "Hiển thị",
    hide: "Ẩn",

    passwordAndSecurity: "Mật Khẩu & Bảo Mật",
    password: "Mật khẩu",
    changePassword: "Đổi mật khẩu",
    twoFactorAuth: "Xác Thực Hai Yếu Tố (2FA)",
    twoFactorDesc: "Bảo vệ tài khoản bằng ứng dụng Authenticator (Google Authenticator, Authy)",
    twoFactorSetup: "Thiết lập",
    activeSessions: "Thiết Bị Đã Đăng Nhập",
    logOutOtherSessions: "Đăng xuất khỏi thiết bị khác",
    currentDevice: "Thiết bị hiện tại",

    nitroTitle: "Mở Khóa Tiềm Năng Với Brave Nitro",
    nitroSubtitle: "Trải nghiệm tính năng cao cấp không giới hạn cho cộng đồng và công việc",
    nitroUploadPerk: "Tải file nặng lên đến 500MB (gấp 10 lần tài khoản thường)",
    nitroBadgePerk: "Huy hiệu MATH VIP độc quyền kế bên tên tài khoản",
    nitroHdPerk: "Stream video HD 1080p 60FPS mượt mà qua LiveKit SFU",
    nitroBannerPerk: "Tùy biến banner hồ sơ động và hiệu ứng đại diện",
    nitroSubscribe: "Đăng ký Brave Nitro ngay",

    online: "Trực tuyến",
    idle: "Chờ",
    dnd: "Không làm phiền",
    invisible: "Vô hình",
    offline: "Ngoại tuyến",
  },
  en: {
    account: "My Account",
    security: "Password & Security",
    devices: "Active Sessions & Devices",
    privacy: "Privacy & Safety",
    nitro: "Brave Nitro",
    language: "Language",
    voiceVideo: "Voice & Video",
    logout: "Log Out",
    search: "Search settings...",
    close: "Close (ESC)",
    save: "Save Changes",
    cancel: "Cancel",
    edit: "Edit",

    accountInfo: "Account Information",
    username: "Username",
    displayName: "Display Name",
    email: "Email",
    phone: "Phone Number",
    bio: "About Me",
    avatar: "Avatar",
    banner: "Profile Banner",
    show: "Show",
    hide: "Hide",

    passwordAndSecurity: "Password & Security",
    password: "Password",
    changePassword: "Change Password",
    twoFactorAuth: "Two-Factor Authentication (2FA)",
    twoFactorDesc: "Protect your account with an Authenticator app (Google Authenticator, Authy)",
    twoFactorSetup: "Set up",
    activeSessions: "Active Sessions",
    logOutOtherSessions: "Log out other sessions",
    currentDevice: "Current Device",

    nitroTitle: "Unlock Your Potential with Brave Nitro",
    nitroSubtitle: "Experience unlimited premium features for your communities and workflow",
    nitroUploadPerk: "Upload heavy files up to 500MB (10x free tier quota)",
    nitroBadgePerk: "Exclusive MATH VIP badge next to your profile name",
    nitroHdPerk: "Stream crystal clear 1080p 60FPS video via LiveKit SFU",
    nitroBannerPerk: "Animated profile banners and dynamic avatar effects",
    nitroSubscribe: "Subscribe to Brave Nitro",

    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    invisible: "Invisible",
    offline: "Offline",
  },
};

const getInitialLang = (): Language => {
  if (typeof window === "undefined") return "vi";
  const saved = localStorage.getItem("bravechat_lang");
  return saved === "en" ? "en" : "vi";
};

export interface I18nState {
  lang: Language;
  t: I18nTranslations;
  setLanguage: (lang: Language) => void;
}

export const i18nStore = createStore<I18nState>({
  lang: "vi",
  t: translations.vi,
  setLanguage: (lang: Language) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bravechat_lang", lang);
    }
    i18nStore.set({ lang, t: translations[lang] });
  },
});

if (typeof window !== "undefined") {
  const initial = getInitialLang();
  i18nStore.set({ lang: initial, t: translations[initial] });
}
