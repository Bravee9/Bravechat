/**
 * app/terms/page.tsx
 * Điều khoản Sử dụng / Terms of Service
 */

import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Điều khoản Sử dụng",
  description:
    "Điều khoản Sử dụng của Bravechat — các quyền, nghĩa vụ và quy tắc áp dụng khi sử dụng nền tảng.",
};

const SECTIONS = [
  { id: "acceptance", label: "1. Chấp nhận điều khoản" },
  { id: "service", label: "2. Mô tả dịch vụ" },
  { id: "account", label: "3. Tài khoản người dùng" },
  { id: "conduct", label: "4. Quy tắc ứng xử" },
  { id: "content", label: "5. Nội dung người dùng" },
  { id: "ip", label: "6. Sở hữu trí tuệ" },
  { id: "termination", label: "7. Chấm dứt dịch vụ" },
  { id: "disclaimer", label: "8. Giới hạn trách nhiệm" },
  { id: "governing", label: "9. Luật áp dụng" },
  { id: "contact", label: "10. Liên hệ" },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Điều khoản Sử dụng"
      titleEn="Terms of Service"
      lastUpdated="28/09/2026"
      sections={SECTIONS}
    >
      {/* ─── Introduction ─── */}
      <Section id="acceptance">
        <SectionHeading en="Acceptance of Terms">
          1. Chấp nhận Điều khoản
        </SectionHeading>
        <p>
          Bằng cách truy cập hoặc sử dụng nền tảng Bravechat (bao gồm trang web tại{" "}
          <strong>bravechat.app</strong> và các ứng dụng liên quan), bạn xác nhận rằng mình đã đọc,
          hiểu và đồng ý bị ràng buộc bởi các Điều khoản Sử dụng này.
        </p>
        <p>
          Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của
          chúng tôi.
        </p>
        <Bilingual>
          By accessing or using the Bravechat platform — including the website at{" "}
          <strong>bravechat.app</strong> and related applications — you confirm that you have read,
          understood, and agree to be bound by these Terms of Service. If you disagree with any
          term, please refrain from using our services.
        </Bilingual>
      </Section>

      {/* ─── Service Description ─── */}
      <Section id="service">
        <SectionHeading en="Description of Service">
          2. Mô tả Dịch vụ
        </SectionHeading>
        <p>
          Bravechat là nền tảng giao tiếp thời gian thực cho phép người dùng tạo lập không gian cộng
          đồng (máy chủ), trao đổi qua kênh văn bản, âm thanh và video, chia sẻ nội dung đa phương
          tiện và kết nối với các cộng đồng trực tuyến.
        </p>
        <p>
          Chúng tôi bảo lưu quyền sửa đổi, tạm ngừng hoặc chấm dứt bất kỳ phần nào của dịch vụ
          vào bất kỳ thời điểm nào mà không cần thông báo trước.
        </p>
        <Bilingual>
          Bravechat is a real-time communication platform that enables users to create community
          spaces (servers), communicate via text, audio, and video channels, share multimedia
          content, and connect with online communities. We reserve the right to modify, suspend, or
          terminate any part of the service at any time without prior notice.
        </Bilingual>
      </Section>

      {/* ─── Account ─── */}
      <Section id="account">
        <SectionHeading en="User Accounts">
          3. Tài khoản Người dùng
        </SectionHeading>
        <ul>
          <li>
            Bạn phải đủ <strong>13 tuổi trở lên</strong> để đăng ký và sử dụng Bravechat.
          </li>
          <li>
            Bạn chịu trách nhiệm duy trì tính bảo mật của thông tin đăng nhập và mọi hoạt động
            diễn ra dưới tài khoản của mình.
          </li>
          <li>
            Mỗi người dùng chỉ được phép duy trì một (01) tài khoản chính. Việc tạo nhiều tài
            khoản nhằm mục đích lách quy định bị nghiêm cấm.
          </li>
          <li>
            Bạn có nghĩa vụ cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký.
          </li>
          <li>
            Bravechat không chịu trách nhiệm về bất kỳ tổn thất nào phát sinh do bạn không tuân
            thủ các yêu cầu bảo mật tài khoản.
          </li>
        </ul>
        <Bilingual>
          You must be at least <strong>13 years old</strong> to register and use Bravechat. You are
          responsible for maintaining the security of your credentials and all activity under your
          account. Each user may maintain only one primary account; creating multiple accounts to
          circumvent policies is prohibited. You must provide accurate, complete, and up-to-date
          information upon registration. Bravechat is not liable for any losses arising from your
          failure to comply with account security requirements.
        </Bilingual>
      </Section>

      {/* ─── Conduct ─── */}
      <Section id="conduct">
        <SectionHeading en="Code of Conduct">
          4. Quy tắc Ứng xử
        </SectionHeading>
        <p>Bằng cách sử dụng Bravechat, bạn cam kết <strong>không</strong> thực hiện bất kỳ hành vi nào sau đây:</p>
        <ul>
          <li>Quấy rối, đe dọa, phân biệt đối xử hoặc xâm phạm quyền riêng tư của người khác.</li>
          <li>Phát tán thông tin sai lệch, nội dung thù địch, hoặc tuyên truyền bạo lực.</li>
          <li>Chia sẻ nội dung khiêu dâm liên quan đến trẻ em (CSAM) hoặc bất kỳ nội dung bất hợp pháp nào.</li>
          <li>Thực hiện hành vi spam, lừa đảo, phishing hoặc phân phối phần mềm độc hại.</li>
          <li>Cố tình can thiệp, phá vỡ hoặc làm gián đoạn hoạt động của dịch vụ.</li>
          <li>Khai thác lỗ hổng bảo mật hoặc truy cập trái phép vào hệ thống.</li>
          <li>Mạo danh cá nhân, tổ chức hoặc nhân viên của Bravechat.</li>
        </ul>
        <Bilingual>
          By using Bravechat, you agree <strong>not</strong> to: harass, threaten, or discriminate
          against others; spread misinformation, hate speech, or violent propaganda; share child
          sexual abuse material (CSAM) or any illegal content; engage in spam, fraud, phishing, or
          malware distribution; intentionally disrupt or interfere with the service; exploit security
          vulnerabilities or gain unauthorized access; or impersonate individuals, organizations, or
          Bravechat employees.
        </Bilingual>
      </Section>

      {/* ─── Content ─── */}
      <Section id="content">
        <SectionHeading en="User Content">
          5. Nội dung Người dùng
        </SectionHeading>
        <p>
          Bạn giữ toàn bộ quyền sở hữu đối với nội dung bạn tạo ra và chia sẻ trên Bravechat. Tuy
          nhiên, bằng cách đăng tải nội dung, bạn cấp cho Bravechat giấy phép không độc quyền,
          miễn phí bản quyền để lưu trữ, hiển thị và phân phối nội dung đó trong phạm vi hoạt động
          của nền tảng.
        </p>
        <p>
          Bravechat có quyền xóa bất kỳ nội dung nào vi phạm Điều khoản này hoặc các quy định
          pháp luật hiện hành mà không cần thông báo trước.
        </p>
        <Bilingual>
          You retain full ownership of the content you create and share on Bravechat. However, by
          posting content, you grant Bravechat a non-exclusive, royalty-free license to store,
          display, and distribute that content within the scope of the platform's operations.
          Bravechat reserves the right to remove any content that violates these Terms or applicable
          laws without prior notice.
        </Bilingual>
      </Section>

      {/* ─── IP ─── */}
      <Section id="ip">
        <SectionHeading en="Intellectual Property">
          6. Sở hữu Trí tuệ
        </SectionHeading>
        <p>
          Toàn bộ thương hiệu, logo, giao diện người dùng, mã nguồn và các tài sản khác của
          Bravechat là tài sản độc quyền của Bravechat và các cộng sự. Bạn không được sao chép,
          phân phối hoặc tạo ra các sản phẩm phái sinh mà không có sự đồng ý bằng văn bản của
          chúng tôi.
        </p>
        <Bilingual>
          All trademarks, logos, user interfaces, source code, and other assets of Bravechat are the
          exclusive property of Bravechat and its contributors. You may not copy, distribute, or
          create derivative works without our prior written consent.
        </Bilingual>
      </Section>

      {/* ─── Termination ─── */}
      <Section id="termination">
        <SectionHeading en="Termination of Service">
          7. Chấm dứt Dịch vụ
        </SectionHeading>
        <p>
          Bravechat có quyền tạm ngừng hoặc chấm dứt tài khoản của bạn ngay lập tức, không cần
          thông báo trước, nếu bạn vi phạm bất kỳ điều khoản nào trong văn bản này. Bạn cũng có thể
          xóa tài khoản của mình bất kỳ lúc nào thông qua cài đặt tài khoản.
        </p>
        <Bilingual>
          Bravechat reserves the right to immediately suspend or terminate your account without prior
          notice if you violate any of these Terms. You may also delete your account at any time via
          account settings.
        </Bilingual>
      </Section>

      {/* ─── Disclaimer ─── */}
      <Section id="disclaimer">
        <SectionHeading en="Limitation of Liability">
          8. Giới hạn Trách nhiệm
        </SectionHeading>
        <p>
          Dịch vụ được cung cấp "nguyên trạng" (<em>as-is</em>) và "theo tình trạng hiện có"
          (<em>as-available</em>). Trong phạm vi tối đa cho phép của pháp luật, Bravechat không
          chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc hệ quả nào
          phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
        </p>
        <Bilingual>
          The service is provided "as-is" and "as-available." To the maximum extent permitted by
          law, Bravechat is not liable for any indirect, incidental, special, or consequential
          damages arising from your use of or inability to use the service.
        </Bilingual>
      </Section>

      {/* ─── Governing Law ─── */}
      <Section id="governing">
        <SectionHeading en="Governing Law">
          9. Luật Áp dụng
        </SectionHeading>
        <p>
          Các Điều khoản Sử dụng này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa xã
          hội chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại tòa án có thẩm
          quyền tại Việt Nam.
        </p>
        <Bilingual>
          These Terms of Service are governed by and construed in accordance with the laws of the
          Socialist Republic of Vietnam. Any disputes shall be resolved in competent courts in
          Vietnam.
        </Bilingual>
      </Section>

      {/* ─── Contact ─── */}
      <Section id="contact">
        <SectionHeading en="Contact">
          10. Liên hệ
        </SectionHeading>
        <p>
          Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi qua:
        </p>
        <ul>
          <li>
            <strong>GitHub:</strong>{" "}
            <a href="https://github.com/Bravee9/Bravechat" target="_blank" rel="noreferrer">
              github.com/Bravee9/Bravechat
            </a>
          </li>
        </ul>
        <Bilingual>
          If you have any questions about these Terms, please contact us via GitHub.
        </Bilingual>
      </Section>
    </LegalLayout>
  );
}

/* ─── Helper sub-components ─── */
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      {children}
    </section>
  );
}

function SectionHeading({ children, en }: { children: React.ReactNode; en: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-black text-ocean-light tracking-tight">{children}</h2>
      <p className="text-ocean-secondary text-xs italic mt-0.5 font-mono">{en}</p>
      <div className="mt-3 h-px bg-ocean-dark-border" />
    </div>
  );
}

function Bilingual({ children }: { children: React.ReactNode }) {
  // Tạm ẩn bản tiếng Anh cho bớt dài, có thể thêm state chuyển đổi sau
  return null;
}
