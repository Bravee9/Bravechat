/**
 * app/status/page.tsx
 * Trạng thái Hệ thống / System Status
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";
import Link from "next/link";

// Static status data — replace with real API call when backend is ready
const SERVICES = [
  { id: "api", name: "API Server", nameEn: "REST API", status: "operational" as const },
  { id: "websocket", name: "WebSocket (Real-time)", nameEn: "WebSocket Gateway", status: "operational" as const },
  { id: "database", name: "Cơ sở dữ liệu", nameEn: "PostgreSQL Database", status: "operational" as const },
  { id: "cache", name: "Cache / Hàng đợi", nameEn: "Redis Cache & Queue", status: "operational" as const },
  { id: "storage", name: "Lưu trữ Media", nameEn: "Cloudflare R2 Storage", status: "operational" as const },
  { id: "cdn", name: "Mạng phân phối nội dung", nameEn: "Cloudflare CDN", status: "operational" as const },
  { id: "auth", name: "Dịch vụ xác thực", nameEn: "Authentication Service", status: "operational" as const },
];

const INCIDENTS: { date: string; title: string; status: string; description: string }[] = [];

const STATUS_LABELS = {
  operational: { vi: "Hoạt động bình thường", en: "Operational", color: "text-emerald-400", dot: "bg-emerald-500" },
  degraded: { vi: "Hiệu suất giảm", en: "Degraded Performance", color: "text-amber-400", dot: "bg-amber-500 animate-pulse" },
  partial: { vi: "Gián đoạn một phần", en: "Partial Outage", color: "text-orange-400", dot: "bg-orange-500 animate-pulse" },
  outage: { vi: "Ngừng hoạt động", en: "Major Outage", color: "text-red-400", dot: "bg-red-500 animate-pulse" },
  maintenance: { vi: "Đang bảo trì", en: "Under Maintenance", color: "text-ocean-secondary", dot: "bg-ocean-secondary" },
};

const overallStatus = SERVICES.every((s) => s.status === "operational")
  ? "operational"
  : "degraded";

export default function StatusPage() {
  const overall = STATUS_LABELS[overallStatus];

  return (
    <div className="relative min-h-screen">
      <OceanBackground />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ocean-light/60 mb-10 font-mono">
          <Link href="/" className="hover:text-ocean-secondary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-ocean-secondary">Trạng thái</span>
        </nav>

        {/* Overall status banner */}
        <div
          className={`mb-12 p-8 border ${overallStatus === "operational" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-5 h-5 ${overall.dot}`} />
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-ocean-light tracking-tight">
                {overall.vi}
              </h1>
              <p className={`text-sm font-mono mt-0.5 ${overall.color}`}>{overall.en}</p>
            </div>
          </div>
          <p className="text-ocean-light/60 text-xs font-mono mt-4">
            Cập nhật lần cuối / Last updated: {new Date().toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Services */}
        <div className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ocean-secondary mb-5">
            Các dịch vụ / Services
          </h2>
          <div className="border border-ocean-dark-border divide-y divide-ocean-dark-border">
            {SERVICES.map((svc) => {
              const cfg = STATUS_LABELS[svc.status];
              return (
                <div key={svc.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-ocean-dark-surface/40 transition-colors">
                  <div>
                    <p className="text-ocean-light font-bold text-sm">{svc.name}</p>
                    <p className="text-ocean-light/50 text-xs font-mono mt-0.5">{svc.nameEn}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 ${cfg.dot}`} />
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.vi}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Uptime history — 90 days placeholder */}
        <div className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ocean-secondary mb-5">
            Lịch sử Uptime (90 ngày) / Uptime History
          </h2>
          <div className="border border-ocean-dark-border p-6">
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 90 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-8 bg-emerald-500/70 hover:bg-emerald-400 transition-colors cursor-pointer"
                  title={`Ngày ${90 - i}: Hoạt động bình thường`}
                />
              ))}
            </div>
            <div className="flex justify-between text-ocean-light/50 text-xs font-mono">
              <span>90 ngày trước</span>
              <span className="text-emerald-400 font-bold">99.9% Uptime</span>
              <span>Hôm nay</span>
            </div>
          </div>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-ocean-secondary mb-5">
            Sự cố gần đây / Recent Incidents
          </h2>
          {INCIDENTS.length === 0 ? (
            <div className="border border-ocean-dark-border p-8 text-center">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-ocean-light/70 text-sm">Không có sự cố nào trong 90 ngày qua.</p>
              <p className="text-ocean-light/40 text-xs font-mono mt-1">No incidents reported in the past 90 days.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {INCIDENTS.map((incident) => (
                <div key={incident.date} className="border border-ocean-dark-border p-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-ocean-light font-bold">{incident.title}</h3>
                    <span className="text-ocean-light/60 text-xs font-mono flex-shrink-0">{incident.date}</span>
                  </div>
                  <p className="text-ocean-light/70 text-sm">{incident.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
