import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function FooterSection({ language: _language }: { language?: "vi" | "en" } = {}) {
  return (
    <footer
      id="footer"
      className="bg-[#09090b] border-t border-[#2B2D30] pb-[30px] pt-[64px] px-6 lg:px-[75.6px] relative shrink-0 w-full"
      data-node-id="67:262"
    >
      <div className="max-w-[1360.813px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] xl:grid-cols-[496.31px_248.17px_248.16px_248.17px] gap-[40px]">
          {/* Column 1: BrandLogo & Tagline */}
          <div className="flex flex-col gap-3 items-start" data-node-id="67:263">
            <BrandLogo href="/" size="lg" />
            <p className="font-['Inter',sans-serif] text-[#9999a2] text-[13px] max-w-[300px] leading-relaxed pt-1">
              Không gian trò chuyện trực tuyến theo máy chủ và kênh dành cho mọi người.
            </p>
          </div>

          {/* Column 2: Sản phẩm */}
          <div className="flex flex-col gap-[12px] items-start" data-node-id="67:269">
            <div className="pb-[6px]" data-node-id="67:270">
              <p
                className="font-['Inter',sans-serif] font-bold text-[13px] text-white whitespace-nowrap"
                data-node-id="67:271"
              >
                Sản phẩm
              </p>
            </div>
            <Link
              href="/#features"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:273"
            >
              Tính năng
            </Link>
            <Link
              href="/channels"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:276"
            >
              Mở ứng dụng Web
            </Link>
            <Link
              href="/roadmap"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:278"
            >
              Lộ trình
            </Link>
          </div>

          {/* Column 3: Tài nguyên */}
          <div className="flex flex-col gap-[12px] items-start" data-node-id="67:281">
            <div className="pb-[6px]" data-node-id="67:282">
              <p
                className="font-['Inter',sans-serif] font-bold text-[13px] text-white whitespace-nowrap"
                data-node-id="67:283"
              >
                Tài nguyên
              </p>
            </div>
            <Link
              href="/docs"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:284"
            >
              Hướng dẫn sử dụng
            </Link>
            <Link
              href="/status"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:286"
            >
              Trạng thái dịch vụ
            </Link>
            <Link
              href="/changelog"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:288"
            >
              Nhật ký cập nhật
            </Link>
          </div>

          {/* Column 4: Chính sách */}
          <div className="flex flex-col gap-[12px] items-start" data-node-id="67:291">
            <div className="pb-[6px]" data-node-id="67:292">
              <p
                className="font-['Inter',sans-serif] font-bold text-[13px] text-white whitespace-nowrap"
                data-node-id="67:293"
              >
                Pháp lý
              </p>
            </div>
            <Link
              href="/terms"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:296"
            >
              Điều khoản sử dụng
            </Link>
            <Link
              href="/privacy"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:298"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="/cookies"
              className="font-['Inter',sans-serif] font-normal text-[#999] hover:text-white text-[13px] whitespace-nowrap transition-colors"
              data-node-id="67:294"
            >
              Chính sách Cookie
            </Link>
          </div>
        </div>

        {/* Bottom Copyright & Language Bar */}
        <div className="pt-[30px] mt-[40px] w-full" data-node-id="67:306">
          <div
            className="border-[#2B2D30] border-solid border-t flex items-center justify-between pt-[24px] w-full"
            data-node-id="67:301"
          >
            <p
              className="font-mono font-medium text-[#7D7D7D] text-[11px] whitespace-nowrap"
              data-node-id="67:302"
            >
              © 2026 Bravechat
            </p>
            <div className="flex items-start" data-node-id="67:304">
              <p
                className="font-mono font-medium text-[#7D7D7D] text-[11px] whitespace-nowrap"
                data-node-id="67:305"
              >
                Web · Sắp có trên Windows, macOS, Linux, iOS &amp; Android
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
