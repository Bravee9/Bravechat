"use client";

const imgIconFeatureChat = "/figma-assets/icon-feature-chat.svg";
const imgIconFeatureVoice = "/figma-assets/icon-feature-voice.svg";
const imgIconFeatureCode = "/figma-assets/icon-feature-code.svg";

export function FeaturesSection() {
  const features = [
    {
      nodeId: "67:157",
      number: "01",
      icon: imgIconFeatureChat,
      title: "Tổ chức rõ ràng",
      desc: "Sắp xếp máy chủ, danh mục và kênh riêng tư theo từng chủ đề để hội thoại không bị lẫn lộn.",
      gradient:
        "linear-gradient(148.498deg, rgba(33, 60, 120, 0.667) 6.1733%, rgba(33, 60, 120, 0) 60.518%), linear-gradient(90deg, rgb(26, 26, 30) 0%, rgb(26, 26, 30) 100%)",
    },
    {
      nodeId: "67:177",
      number: "02",
      icon: imgIconFeatureVoice,
      title: "Phòng thoại & chia sẻ màn hình",
      desc: "Tham gia phòng thoại, bật camera hoặc chia sẻ màn hình trực tiếp ngay trong không gian làm việc.",
      gradient:
        "linear-gradient(148.499deg, rgba(20, 61, 73, 0.667) 6.1733%, rgba(20, 61, 73, 0) 60.518%), linear-gradient(90deg, rgb(26, 26, 30) 0%, rgb(26, 26, 30) 100%)",
    },
    {
      nodeId: "67:192",
      number: "03",
      icon: imgIconFeatureCode,
      title: "Phân quyền & quản trị trực quan",
      desc: "Quản lý thành viên, thiết lập vai trò và giới hạn quyền truy cập cho từng kênh một cách minh bạch.",
      gradient:
        "linear-gradient(148.498deg, rgba(53, 38, 91, 0.667) 6.1733%, rgba(53, 38, 91, 0) 60.518%), linear-gradient(90deg, rgb(26, 26, 30) 0%, rgb(26, 26, 30) 100%)",
    },
  ];

  return (
    <section
      id="features"
      className="bg-[#101013] border-[#29292f] border-solid border-t pb-[125px] pt-[110px] px-6 lg:px-[75.6px] relative shrink-0 w-full"
      data-node-id="67:145"
    >
      <div className="max-w-[1360.813px] mx-auto w-full flex flex-col items-start">
        {/* Eyebrow (67:146) */}
        <div className="flex flex-col items-start relative shrink-0 w-full" data-node-id="67:146">
          <p
            className="font-mono font-bold text-[#777782] text-[11px] tracking-[0.88px] whitespace-nowrap"
            data-node-id="67:147"
          >
            02 / MỘT NƠI CHO MỌI THỨ
          </p>
        </div>

        {/* Heading & Description (67:209) */}
        <div className="w-full pt-[28px]" data-node-id="67:209">
          <div
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 w-full"
            data-node-id="67:149"
          >
            <div className="flex flex-col items-start" data-node-id="67:150">
              <h2
                className="font-['Inter',sans-serif] font-bold text-[#f2f2f3] text-[48px] sm:text-[68px] xl:text-[88px] leading-[0.95] xl:leading-[83.6px] tracking-[-0.065em] xl:tracking-[-5.72px]"
                data-node-id="67:151"
              >
                <span className="block">Được thiết kế</span>
                <span className="block">
                  <span>{`để luôn trong `}</span>
                  <span className="text-[#72a2ff]">flow.</span>
                </span>
              </h2>
            </div>

            <div className="flex flex-col items-start lg:max-w-[318px]" data-node-id="67:153">
              <p
                className="font-['Inter',sans-serif] font-normal leading-[28.05px] text-[#9999a2] text-[17px]"
                data-node-id="67:154"
              >
                Ít chuyển cửa sổ hơn. Ít gián đoạn hơn. Mọi cuộc hội thoại và công cụ quan trọng luôn ở đúng nơi bạn cần.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (67:210) */}
        <div className="pt-[64px] w-full" data-node-id="67:210">
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-[12px] w-full"
            data-node-id="67:156"
          >
            {features.map((item) => (
              <article
                key={item.number}
                className="border border-[#34343b] border-solid flex flex-col items-start justify-between min-h-[390px] overflow-hidden p-[30px] relative"
                data-node-id={item.nodeId}
                style={{ backgroundImage: item.gradient }}
              >
                <div className="w-full">
                  <div className="flex flex-col h-[65px] items-start pb-[50px] relative shrink-0">
                    <span className="font-mono font-semibold text-[#efeff2] text-[11px] whitespace-nowrap">
                      {item.number}
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <img alt="" src={item.icon} className="block shrink-0" />
                  </div>
                </div>

                <div className="flex flex-col items-start relative shrink-0 w-full">
                  <h3 className="font-['Inter',sans-serif] font-bold text-[#efeff2] text-[23px] tracking-[-0.805px]">
                    {item.title}
                  </h3>
                  <div className="pt-[13px]">
                    <p className="font-['Inter',sans-serif] font-normal leading-[24.8px] text-[#a5a5ae] text-[16px] max-w-[340px]">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className="absolute font-['Inter',sans-serif] font-normal right-[26px] text-[#efeff2] text-[26px] top-[26px] leading-none"
                >
                  ↗
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
