"use client";

import Link from "next/link";

const imgHeroEmblem = "/figma-assets/hero-emblem.png";
const imgIconArrowDark = "/figma-assets/icon-arrow-dark.svg";
const imgIconSend = "/figma-assets/icon-send.svg";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="flex flex-col justify-between min-h-[918px] overflow-hidden relative shrink-0 w-full bg-[#0b0b0d]"
      data-node-id="67:38"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgb(34, 34, 40) 0.10893%, rgba(0, 0, 0, 0) 0.10893%), linear-gradient(90deg, rgb(34, 34, 40) 0%, rgba(0, 0, 0, 0) 0%), radial-gradient(circle at 76% 28%, rgba(23, 38, 75, 1) 0%, rgba(23, 38, 75, 0) 42%), linear-gradient(90deg, rgb(11, 11, 13) 0%, rgb(11, 11, 13) 100%)",
      }}
    >
      <div className="w-full">
        {/* Eyebrow Row (67:143) */}
        <div className="flex flex-col items-center relative shrink-0 w-full" data-node-id="67:143">
          <div
            className="font-mono font-semibold h-[48px] max-w-[1440px] w-full px-6 lg:px-[75.6px] flex items-end pb-[1px] gap-[15px] text-[11px] tracking-[0.88px] whitespace-nowrap"
            data-node-id="67:39"
          >
            <span className="text-[#48d6ff]" data-node-id="67:41">
              01
            </span>
            <span className="text-[#777782]" data-node-id="67:43">
              GIAO TIẾP / SÁNG TẠO / CÙNG NHAU
            </span>
          </div>
        </div>

        {/* Hero Main Content Grid (67:144) */}
        <div className="flex flex-col items-center relative shrink-0 w-full" data-node-id="67:144">
          <div
            className="max-w-[1440px] w-full min-h-[640px] pb-[66px] pt-[24px] px-6 lg:px-[75.6px] grid grid-cols-1 xl:grid-cols-[626.45px_601.89px] gap-[60.48px] items-center justify-between"
            data-node-id="67:44"
          >
            {/* Left Copy (67:45) */}
            <div
              className="flex flex-col items-start justify-center relative shrink-0"
              data-node-id="67:45"
            >
              <h1
                className="font-['Inter',sans-serif] font-bold max-w-[760px] text-[54px] sm:text-[76px] xl:text-[94px] leading-[0.92] xl:leading-[86.48px] tracking-[-0.075em] xl:tracking-[-7.05px] text-white w-full"
                data-node-id="67:46"
              >
                <span className="block" data-node-id="67:47">
                  Mọi ý tưởng
                </span>
                <span
                  className="block bg-clip-text text-transparent"
                  data-node-id="67:50"
                  style={{
                    backgroundImage:
                      "linear-gradient(107.051deg, rgb(72, 214, 255) 3.67%, rgb(98, 136, 255) 50%, rgb(183, 129, 255) 96.33%)",
                  }}
                >
                  bắt đầu
                </span>
                <span className="block max-w-[627px]" data-node-id="67:51">
                  từ một cuộc trò chuyện.
                </span>
              </h1>

              <div className="flex flex-col items-start pt-[32px] relative shrink-0" data-node-id="67:66">
                <p
                  className="font-['Inter',sans-serif] font-normal leading-[32px] text-[#a8a8b0] text-[18px] sm:text-[20px] max-w-[590px]"
                  data-node-id="67:53"
                >
                  Nơi trò chuyện, họp nhóm và tổ chức không gian chung dành cho mọi người — từ nhóm bạn, cộng đồng đến các đội ngũ làm việc.
                </p>
              </div>

              <div
                className="flex flex-wrap gap-[28px] items-center pt-[36px] relative shrink-0 w-full max-w-[626.453px]"
                data-node-id="67:55"
              >
                <Link
                  id="hero-cta-register"
                  href="/register"
                  className="bg-[#f4f4f5] hover:bg-white border border-transparent flex gap-[18px] items-center justify-center min-h-[42px] px-[22px] relative rounded-[2px] shrink-0 transition-colors"
                  data-node-id="67:56"
                >
                  <span
                    className="font-['Inter',sans-serif] font-bold text-[#08080a] text-[13px] text-center whitespace-nowrap"
                    data-node-id="67:57"
                  >
                    Bắt đầu miễn phí
                  </span>
                  <img alt="" src={imgIconArrowDark} className="block shrink-0" />
                </Link>

                <Link
                  href="/channels"
                  className="border-[#52525b] hover:border-white border-b border-solid font-['Inter',sans-serif] font-semibold h-[46px] flex items-center justify-between px-[2px] text-[#cacad0] hover:text-white text-[16px] w-[200.625px] whitespace-nowrap transition-colors"
                  data-node-id="67:61"
                >
                  <span data-node-id="67:62">Khám phá Bravechat</span>
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7l10 10M17 7v10H7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right HeroArt (67:68) */}
            <div
              className="h-[530px] relative shrink-0 w-full max-w-[601.89px] mx-auto"
              data-node-id="67:68"
              data-name="HeroArt"
            >
              {/* Background Blur Glow (67:69) */}
              <div
                className="absolute flex h-[502.549px] items-center justify-center left-[29.2px] top-[34.93px] w-[591.635px] pointer-events-none"
                data-node-id="67:69"
              >
                <div
                  className="rounded-full blur-[96px] h-[440px] opacity-35 relative w-[520px]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgb(27, 108, 255) 0%, rgb(87, 220, 255) 45%, rgba(120, 103, 255, 0) 75%)",
                  }}
                />
              </div>

              {/* 3D Hero Emblem Image (67:70) */}
              <div
                className="absolute flex items-center justify-center left-[280.13px] size-[303.338px] top-[-6.37px] pointer-events-none"
                data-node-id="67:70"
              >
                <div className="flex-none rotate-[5deg]">
                  <div className="opacity-[0.86] relative size-[280px]">
                    <img
                      alt=""
                      className="absolute inset-0 max-w-none object-contain size-full drop-shadow-[0_24px_48px_rgba(0,0,0,0.75)]"
                      src={imgHeroEmblem}
                    />
                  </div>
                </div>
              </div>

              {/* Code Window: community.ts (67:71) */}
              <div
                className="absolute flex h-[261.318px] items-center justify-center left-[40px] sm:left-[137.21px] top-[56.31px] w-[471.931px] max-w-full"
                data-node-id="67:71"
              >
                <div className="flex-none rotate-[4deg]">
                  <div className="bg-[#1c1c20] border border-[#42424a] border-solid drop-shadow-[0px_28px_32.5px_rgba(0,0,0,0.8)] flex flex-col items-start relative rounded-[3px] w-[340px] sm:w-[457px]">
                    <div
                      className="bg-[#242429] border-[#3b3b42] border-b border-solid flex gap-[6px] h-[38px] items-center px-[12px] relative shrink-0 w-full"
                      data-node-id="67:72"
                    >
                      <div className="bg-[#67676f] relative rounded-[3.5px] shrink-0 size-[7px]" data-node-id="67:73" />
                      <div className="bg-[#67676f] relative rounded-[3.5px] shrink-0 size-[7px]" data-node-id="67:74" />
                      <div className="bg-[#67676f] relative rounded-[3.5px] shrink-0 size-[7px]" data-node-id="67:75" />
                      <div className="flex items-start pl-[8px] relative shrink-0" data-node-id="67:79">
                        <span
                          className="font-mono font-normal text-[#aaa] text-[10px] whitespace-nowrap"
                          data-node-id="67:77"
                        >
                          community.ts
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex flex-col items-start pb-[36px] pt-[28px] px-[30px] relative shrink-0 w-full"
                      data-node-id="67:80"
                    >
                      <div
                        className="font-mono text-[14px] leading-[25.2px] whitespace-pre"
                        data-node-id="67:81"
                      >
                        <p className="mb-0">
                          <span className="font-bold text-[#ff66b9]">const</span>
                          <span className="font-medium text-[#ddd]">{` community = {`}</span>
                        </p>
                        <p className="font-medium mb-0">
                          <span className="text-[#ddd]">{` people: `}</span>
                          <span className="text-[#e4e87b]">{`"curious"`}</span>
                          <span className="text-[#ddd]">,</span>
                        </p>
                        <p className="font-medium mb-0">
                          <span className="text-[#ddd]">{` ideas: `}</span>
                          <span className="text-[#e4e87b]">{`"unlimited"`}</span>
                          <span className="text-[#ddd]">,</span>
                        </p>
                        <p className="mb-0">
                          <span className="font-medium text-[#ddd]">{` status: `}</span>
                          <span className="font-bold text-[#6fd6ff]">{`"online"`}</span>
                        </p>
                        <p className="font-medium text-[#ddd] mb-0">{`}`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Window: # phòng-sản-phẩm (67:83) */}
              <div
                className="absolute flex h-[235.688px] items-center justify-center left-[8.09px] top-[295.78px] w-[489.349px] max-w-full"
                data-node-id="67:83"
              >
                <div className="-rotate-[2deg] flex-none">
                  <div className="bg-[#1c1c20] border border-[#42424a] border-solid drop-shadow-[0px_28px_32.5px_rgba(0,0,0,0.8)] flex flex-col items-start relative rounded-[3px] w-[350px] sm:w-[482px]">
                    <div
                      className="bg-[#242429] border-[#3b3b42] border-b border-solid flex gap-[6px] h-[38px] items-center px-[12px] relative shrink-0 w-full"
                      data-node-id="67:84"
                    >
                      <div className="bg-[#67676f] relative rounded-[3.5px] shrink-0 size-[7px]" data-node-id="67:85" />
                      <div className="bg-[#67676f] relative rounded-[3.5px] shrink-0 size-[7px]" data-node-id="67:86" />
                      <div className="bg-[#67676f] relative rounded-[3.5px] shrink-0 size-[7px]" data-node-id="67:87" />
                      <div className="flex flex-col items-start pl-[8px] relative shrink-0" data-node-id="67:88">
                        <span
                          className="font-mono font-normal text-[#aaa] text-[10px] whitespace-nowrap"
                          data-node-id="67:89"
                        >
                          # phòng-sản-phẩm
                        </span>
                      </div>
                    </div>

                    {/* Message 1: An Khuê (67:91) */}
                    <div
                      className="flex gap-[11px] h-[57px] items-start pb-[5px] pt-[14px] px-[18px] relative shrink-0 w-full"
                      data-node-id="67:91"
                    >
                      <div
                        className="flex items-center justify-center relative shrink-0 size-[31px]"
                        data-node-id="67:92"
                        style={{
                          backgroundImage:
                            "linear-gradient(135deg, rgb(255, 46, 166) 0%, rgb(123, 97, 255) 100%)",
                        }}
                      >
                        <span
                          className="font-mono font-bold text-[10px] text-white whitespace-nowrap"
                          data-node-id="67:93"
                        >
                          AK
                        </span>
                      </div>
                      <div className="flex flex-col relative shrink-0" data-node-id="67:95">
                        <div className="flex items-baseline gap-[8px]">
                          <span
                            className="font-['Inter',sans-serif] font-bold leading-[19.2px] text-[12px] text-white"
                            data-node-id="67:96"
                          >
                            An Khuê
                          </span>
                          <span
                            className="font-['Inter',sans-serif] font-normal leading-[16px] text-[#7f7f87] text-[10px]"
                            data-node-id="67:99"
                          >
                            10:24
                          </span>
                        </div>
                        <p
                          className="font-['Inter',sans-serif] font-normal leading-[19.2px] text-[#ddd] text-[12px]"
                          data-node-id="67:101"
                        >
                          Mọi người xem thử bản build mới nhé.
                        </p>
                      </div>
                    </div>

                    {/* Message 2: Minh Châu (67:102) */}
                    <div
                      className="flex gap-[11px] h-[58px] items-start pb-[5px] pt-[14px] px-[18px] relative shrink-0 w-full"
                      data-node-id="67:102"
                    >
                      <div
                        className="flex items-center justify-center relative shrink-0 size-[31px]"
                        data-node-id="67:103"
                        style={{
                          backgroundImage:
                            "linear-gradient(135deg, rgb(8, 124, 250) 0%, rgb(0, 200, 255) 100%)",
                        }}
                      >
                        <span
                          className="font-mono font-bold text-[10px] text-white whitespace-nowrap"
                          data-node-id="67:104"
                        >
                          MC
                        </span>
                      </div>
                      <div className="flex flex-col relative shrink-0" data-node-id="67:105">
                        <div className="flex items-baseline gap-[8px]">
                          <span
                            className="font-['Inter',sans-serif] font-bold leading-[19.2px] text-[12px] text-white"
                            data-node-id="67:106"
                          >
                            Minh Châu
                          </span>
                          <span
                            className="font-['Inter',sans-serif] font-normal leading-[16px] text-[#7f7f87] text-[10px]"
                            data-node-id="67:108"
                          >
                            10:26
                          </span>
                        </div>
                        <p
                          className="font-mono font-normal leading-[19.2px] text-[#b9f227] text-[12px]"
                          data-node-id="67:109"
                        >
                          ✓ 48 tests passed
                        </p>
                      </div>
                    </div>

                    {/* Input Placeholder (67:116) */}
                    <div
                      className="flex flex-col items-start pb-[16px] pt-[14px] px-[16px] relative shrink-0 w-full"
                      data-node-id="67:116"
                    >
                      <div
                        className="bg-[#29292e] flex h-[34px] items-center justify-between px-[11px] relative shrink-0 w-full"
                        data-node-id="67:110"
                      >
                        <span
                          className="font-['Inter',sans-serif] font-normal text-[#888] text-[10px] whitespace-nowrap"
                          data-node-id="67:111"
                        >
                          Nhắn #phòng-sản-phẩm
                        </span>
                        <img alt="" src={imgIconSend} className="block shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Label 1: THOẠI / 8 TRỰC TUYẾN (67:117) */}
              <div
                className="absolute flex h-[39.398px] items-center justify-center left-[-13px] top-[47.3px] w-[133.938px]"
                data-node-id="67:117"
              >
                <div className="-rotate-[5deg] flex-none">
                  <div className="bg-[#234caa] drop-shadow-[4px_4px_0px_#0a0a0c] flex flex-col items-start px-[12px] py-[8px] relative">
                    <span
                      className="font-mono font-bold text-[#dfe7ff] text-[9px] whitespace-nowrap"
                      data-node-id="67:118"
                    >
                      THOẠI / 8 TRỰC TUYẾN
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Label 2: CÙNG NHAU XÂY DỰNG_ (67:120) */}
              <div
                className="absolute flex h-[36.791px] items-center justify-center right-0 sm:left-[480.28px] top-[412.81px] w-[128.644px]"
                data-node-id="67:120"
              >
                <div className="flex-none rotate-[4deg]">
                  <div className="bg-[#48d6ff] drop-shadow-[4px_4px_0px_#0a0a0c] flex flex-col items-start px-[12px] py-[8px] relative">
                    <span
                      className="font-mono font-bold text-[#081017] text-[9px] whitespace-nowrap"
                      data-node-id="67:121"
                    >
                      CÙNG NHAU XÂY DỰNG_
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ticker Strip (67:122) */}
      <div
        className="bg-[#151518] border-[#34343a] border-solid border-t min-h-[54px] w-full"
        data-node-id="67:122"
      >
        <div className="max-w-[1512px] mx-auto h-[54px] px-6 lg:px-[49.05px] flex items-center justify-between overflow-x-auto gap-6 whitespace-nowrap">
          <span className="font-mono font-bold text-[#bdbdc5] text-[13px]" data-node-id="67:124">
            KÊNH TRÒ CHUYỆN
          </span>
          <span className="font-mono font-extrabold text-[#4589ff] text-[23px]" data-node-id="67:127">
            +
          </span>
          <span className="font-mono font-bold text-[#bdbdc5] text-[13px]" data-node-id="67:130">
            PHÒNG THOẠI
          </span>
          <span className="font-mono font-extrabold text-[#4589ff] text-[23px]" data-node-id="67:132">
            +
          </span>
          <span className="font-mono font-bold text-[#bdbdc5] text-[13px]" data-node-id="67:134">
            CỘNG ĐỒNG
          </span>
          <span className="font-mono font-extrabold text-[#4589ff] text-[23px]" data-node-id="67:136">
            +
          </span>
          <span className="font-mono font-bold text-[#bdbdc5] text-[13px]" data-node-id="67:138">
            Ý TƯỞNG
          </span>
          <span className="font-mono font-extrabold text-[#4589ff] text-[23px]" data-node-id="67:140">
            +
          </span>
          <span className="font-mono font-bold text-[#bdbdc5] text-[13px]" data-node-id="67:142">
            BRAVECHAT
          </span>
        </div>
      </div>
    </section>
  );
}
