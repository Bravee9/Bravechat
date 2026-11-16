"use client";

import Link from "next/link";

const imgIconArrowDark = "/figma-assets/icon-arrow-dark.svg";
const imgIconArrowCta = "/figma-assets/icon-arrow-cta.svg";

export function CommunitySection() {
  return (
    <div id="community" className="w-full">
      {/* Section 03: Hệ sinh thái Brave (67:211) */}
      <section
        id="ecosystem"
        className="bg-[#0d0d10] border-[#29292f] border-b border-t border-solid w-full"
        data-node-id="67:211"
      >
        <div className="max-w-[1512px] mx-auto grid grid-cols-1 lg:grid-cols-[56%_44%] xl:grid-cols-[846.72px_665.28px] min-h-[680px]">
          {/* Left Column (67:212) */}
          <div
            className="border-b lg:border-b-0 lg:border-r border-[#2c2c32] border-solid flex flex-col items-start justify-center pl-6 lg:pl-[75.6px] pr-6 lg:pr-[120.96px] py-[80px] lg:py-[100px]"
            data-node-id="67:212"
          >
            <div className="pb-[28px]" data-node-id="67:226">
              <p
                className="font-mono font-bold text-[#777782] text-[11px] tracking-[0.88px] whitespace-nowrap"
                data-node-id="67:214"
              >
                03 / HỆ SINH THÁI BRAVE
              </p>
            </div>

            <div className="flex flex-col items-start" data-node-id="67:215">
              <h2
                className="font-['Inter',sans-serif] font-bold text-[52px] sm:text-[72px] xl:text-[88px] leading-[0.95] xl:leading-[84px] text-white tracking-[-0.065em] xl:tracking-[-5.5px]"
                data-node-id="67:216"
              >
                <span className="block">Dành cho mọi</span>
                <span className="block">nhóm & cộng đồng.</span>
              </h2>
            </div>

            <div className="py-[40px]" data-node-id="67:227">
              <p
                className="font-['Inter',sans-serif] font-normal leading-[29.7px] text-[#b3b3b8] text-[18px] max-w-[580px]"
                data-node-id="67:219"
              >
                Sử dụng ngay trên trình duyệt Web, với lộ trình mở rộng sang ứng dụng riêng trên Windows, macOS, Linux, Android và iOS.
              </p>
            </div>

            <Link
              href="/channels"
              className="bg-[#f4f4f5] hover:bg-white border border-transparent flex gap-[18px] items-center justify-center min-h-[42px] px-[22px] relative rounded-[2px] shrink-0 transition-colors"
              data-node-id="67:221"
            >
              <span
                className="font-['Inter',sans-serif] font-bold text-[#08080a] text-[13px] text-center whitespace-nowrap"
                data-node-id="67:222"
              >
                Xem workspace mẫu
              </span>
              <img alt="" src={imgIconArrowDark} className="block shrink-0" />
            </Link>
          </div>

          {/* Right Metrics Column (67:228) */}
          <div
            className="bg-[#34343a] grid grid-rows-3 gap-y-px"
            data-node-id="67:228"
          >
            {/* Metric 1 (67:229) */}
            <div
              className="bg-[#1b1b1f] border-[#3c3c42] border-b border-solid flex flex-col items-start justify-center px-6 lg:px-[75.6px] py-[42px]"
              data-node-id="67:229"
            >
              <p
                className="font-['Inter',sans-serif] font-bold leading-[72px] text-[#f1f1f3] text-[48px] sm:text-[64px] xl:text-[72px] tracking-[-3.5px] whitespace-nowrap"
                data-node-id="67:231"
              >
                Web & App
              </p>
              <div className="pt-[16px]" data-node-id="67:233">
                <p
                  className="font-mono font-medium text-[#bbb] text-[12px] uppercase whitespace-nowrap"
                  data-node-id="67:234"
                >
                  Hỗ trợ trình duyệt · Lộ trình Desktop & Mobile
                </p>
              </div>
            </div>

            {/* Metric 2 (67:237) */}
            <div
              className="bg-[#1b1b1f] border-[#3c3c42] border-b border-solid flex flex-col items-start justify-center px-6 lg:px-[75.6px] py-[42px] relative shadow-[inset_4px_0px_0px_0px_#087cfa]"
              data-node-id="67:237"
            >
              <p
                className="font-['Inter',sans-serif] font-bold leading-[72px] text-[#72a2ff] text-[48px] sm:text-[64px] xl:text-[72px] tracking-[-3.5px] whitespace-nowrap"
                data-node-id="67:239"
              >
                Phân quyền
              </p>
              <div className="pt-[16px]" data-node-id="67:240">
                <p
                  className="font-mono font-medium text-[12px] text-white uppercase whitespace-nowrap"
                  data-node-id="67:241"
                >
                  Vai trò tùy chỉnh & bảo vệ kênh riêng tư
                </p>
              </div>
            </div>

            {/* Metric 3 (67:243) */}
            <div
              className="bg-[#1b1b1f] border-[#3c3c42] border-b border-solid flex flex-col items-start justify-center px-6 lg:px-[75.6px] py-[42px]"
              data-node-id="67:243"
            >
              <p
                className="font-['Inter',sans-serif] font-bold leading-[72px] text-[#f1f1f3] text-[48px] sm:text-[64px] xl:text-[72px] tracking-[-3.5px] whitespace-nowrap"
                data-node-id="67:245"
              >
                Đồng bộ
              </p>
              <div className="pt-[16px]" data-node-id="67:246">
                <p
                  className="font-mono font-medium text-[#bbb] text-[12px] uppercase whitespace-nowrap"
                  data-node-id="67:247"
                >
                  Tin nhắn văn bản, phòng thoại & chia sẻ tệp
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Sẵn sàng? (67:249) */}
      <section
        className="border-[#2c2c32] border-b border-solid flex flex-col min-h-[540px] items-start justify-center overflow-hidden px-6 lg:px-[75.6px] py-[100px] relative shrink-0 w-full"
        data-node-id="67:249"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 50%, rgba(23, 38, 83, 1) 0%, rgba(23, 38, 83, 0) 35%), linear-gradient(90deg, rgb(18, 18, 21) 0%, rgb(18, 18, 21) 100%)",
        }}
      >
        <div className="max-w-[1360.813px] mx-auto w-full relative z-10 flex flex-col items-start">
          <div className="pb-[28px]" data-node-id="67:260">
            <p
              className="font-mono font-bold text-[#777782] text-[11px] tracking-[0.88px] whitespace-nowrap"
              data-node-id="67:252"
            >
              04 / SẴN SÀNG?
            </p>
          </div>

          <div className="flex flex-col items-start max-w-[940px]" data-node-id="67:253">
            <h2
              className="font-['Inter',sans-serif] font-bold text-[#f2f2f3] text-[48px] sm:text-[68px] xl:text-[88px] leading-[0.95] xl:leading-[83.6px] tracking-[-0.065em] xl:tracking-[-5.72px]"
              data-node-id="67:254"
            >
              <span className="block">Xây dựng điều</span>
              <span className="block">
                <span className="text-[#72a2ff]">tuyệt vời</span>
                <span>{` cùng nhau.`}</span>
              </span>
            </h2>
          </div>

          <div className="pt-[44px]" data-node-id="67:261">
            <Link
              href="/channels"
              className="bg-[#315fc5] hover:bg-[#3b6cd8] border border-[#4c7de7] border-solid flex gap-[18px] items-center justify-center min-h-[42px] px-[30px] relative rounded-[2px] shrink-0 transition-colors"
              data-node-id="67:255"
            >
              <span
                className="font-['Inter',sans-serif] font-bold text-[13px] text-center text-white whitespace-nowrap"
                data-node-id="67:256"
              >
                Mở Bravechat
              </span>
              <img alt="" src={imgIconArrowCta} className="block shrink-0" />
            </Link>
          </div>
        </div>

        {/* Rotated Gradient Accent (67:250) */}
        <div
          className="absolute flex items-center justify-center right-[-120px] xl:left-[1085.31px] size-[533.376px] top-[-26.69px] pointer-events-none"
          data-node-id="67:250"
        >
          <div className="flex-none rotate-[14deg]">
            <div
              className="opacity-[0.28] relative size-[440px]"
              style={{
                backgroundImage:
                  "linear-gradient(145deg, rgb(72, 214, 255) 6.1733%, rgb(69, 108, 255) 50%, rgb(163, 105, 255) 93.827%)",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
