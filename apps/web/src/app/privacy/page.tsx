/**
 * app/privacy/page.tsx
 * Chính sách Bảo mật / Privacy Policy
 */

import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Chính sách Bảo mật",
  description:
    "Chính sách Bảo mật của Bravechat — cách chúng tôi thu thập, xử lý và bảo vệ dữ liệu cá nhân của bạn.",
};

const SECTIONS = [
  { id: "overview", label: "1. Tổng quan" },
  { id: "data-collected", label: "2. Dữ liệu chúng tôi thu thập" },
  { id: "purpose", label: "3. Mục đích xử lý" },
  { id: "storage", label: "4. Lưu trữ & Bảo mật" },
  { id: "sharing", label: "5. Chia sẻ dữ liệu" },
  { id: "cookies", label: "6. Cookie & Công nghệ theo dõi" },
  { id: "rights", label: "7. Quyền của bạn" },
  { id: "retention", label: "8. Thời gian lưu trữ" },
  { id: "minors", label: "9. Trẻ em" },
  { id: "changes", label: "10. Thay đổi chính sách" },
  { id: "contact", label: "11. Liên hệ" },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Chính sách Bảo mật"
      titleEn="Privacy Policy"
      lastUpdated="28/09/2026"
      sections={SECTIONS}
    >
      {/* ─── 1 ─── */}
      <Section id="overview">
        <SectionHeading en="Overview">1. Tổng quan</SectionHeading>
        <p>
          Bravechat ("chúng tôi") cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng.
          Chính sách Bảo mật này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông
          tin của bạn khi bạn sử dụng nền tảng Bravechat.
        </p>
        <p>
          Chính sách này áp dụng cho tất cả người dùng tại mọi quốc gia và tuân thủ các quy định
          bảo vệ dữ liệu được áp dụng tại Việt Nam.
        </p>
        <Bilingual>
          Bravechat ("we") is committed to protecting the privacy and personal data of our users.
          This Privacy Policy describes how we collect, use, store, and safeguard your information
          when you use the Bravechat platform. This Policy applies to all users worldwide and
          complies with applicable data protection regulations in Vietnam.
        </Bilingual>
      </Section>

      {/* ─── 2 ─── */}
      <Section id="data-collected">
        <SectionHeading en="Data We Collect">2. Dữ liệu Chúng tôi Thu thập</SectionHeading>
        <p>Chúng tôi thu thập các loại dữ liệu sau:</p>
        <DataTable
          rows={[
            ["Thông tin tài khoản", "Email, tên người dùng, tên hiển thị, mật khẩu (đã băm)"],
            ["Nội dung truyền thông", "Tin nhắn văn bản, tệp đính kèm, hình ảnh, video bạn chia sẻ"],
            ["Dữ liệu sử dụng", "Thời gian đăng nhập, địa chỉ IP, trình duyệt, hệ điều hành"],
            ["Dữ liệu máy chủ", "Tên máy chủ, kênh, vai trò bạn tham gia hoặc quản lý"],
            ["Cookie", "Session token, tùy chọn giao diện (xem mục 6)"],
          ]}
        />
        <p>
          Chúng tôi <strong>không</strong> thu thập dữ liệu tài chính, số điện thoại hay vị trí GPS
          trừ khi bạn tự nguyện cung cấp.
        </p>
        <Bilingual>
          We collect: account information (email, username, display name, hashed password);
          communication content (messages, attachments, images, videos you share); usage data (login
          times, IP address, browser, OS); server data (server names, channels, roles you join or
          manage); and cookies (session tokens, UI preferences). We do <strong>not</strong> collect
          financial data, phone numbers, or GPS location unless voluntarily provided.
        </Bilingual>
      </Section>

      {/* ─── 3 ─── */}
      <Section id="purpose">
        <SectionHeading en="Purpose of Processing">3. Mục đích Xử lý</SectionHeading>
        <ul>
          <li>Cung cấp, duy trì và cải thiện các tính năng của dịch vụ.</li>
          <li>Xác thực danh tính người dùng và bảo vệ tài khoản.</li>
          <li>Phát hiện và ngăn chặn gian lận, lạm dụng và vi phạm điều khoản.</li>
          <li>Gửi thông báo kỹ thuật và hỗ trợ người dùng.</li>
          <li>Tuân thủ nghĩa vụ pháp lý khi có yêu cầu từ cơ quan có thẩm quyền.</li>
        </ul>
        <Bilingual>
          We process data to: provide, maintain, and improve service features; authenticate users and
          protect accounts; detect and prevent fraud, abuse, and policy violations; send technical
          notifications and user support; and comply with legal obligations when requested by
          competent authorities.
        </Bilingual>
      </Section>

      {/* ─── 4 ─── */}
      <Section id="storage">
        <SectionHeading en="Storage & Security">4. Lưu trữ & Bảo mật</SectionHeading>
        <p>
          Dữ liệu của bạn được lưu trữ trên các máy chủ bảo mật. Chúng tôi áp dụng các biện pháp
          bảo mật sau:
        </p>
        <ul>
          <li>
            <strong>Bcrypt hashing</strong> cho toàn bộ mật khẩu — mật khẩu gốc không bao giờ được
            lưu trữ.
          </li>
          <li>
            <strong>JWT (JSON Web Tokens)</strong> có thời hạn ngắn kết hợp với refresh token
            rotation để xác thực phiên.
          </li>
          <li>
            <strong>Rate limiting</strong> chống brute-force và tấn công từ chối dịch vụ.
          </li>
          <li>
            <strong>TLS/HTTPS</strong> cho toàn bộ lưu lượng mạng.
          </li>
          <li>
            Tệp media được lưu trữ trên{" "}
            <strong>Cloudflare R2</strong> với kiểm soát truy cập nghiêm ngặt.
          </li>
        </ul>
        <Bilingual>
          Your data is stored on secured servers. We apply: Bcrypt hashing for all passwords (raw
          passwords are never stored); short-lived JWT with refresh token rotation for session
          authentication; rate limiting against brute-force and denial-of-service attacks;
          TLS/HTTPS for all network traffic; and media files stored on Cloudflare R2 with strict
          access controls.
        </Bilingual>
      </Section>

      {/* ─── 5 ─── */}
      <Section id="sharing">
        <SectionHeading en="Data Sharing">5. Chia sẻ Dữ liệu</SectionHeading>
        <p>
          Chúng tôi <strong>không bán</strong> dữ liệu cá nhân của bạn cho bên thứ ba. Dữ liệu chỉ
          được chia sẻ trong các trường hợp sau:
        </p>
        <ul>
          <li>
            <strong>Nhà cung cấp dịch vụ hạ tầng</strong> (ví dụ: Cloudflare, nhà cung cấp cơ sở
            dữ liệu) — chỉ ở mức cần thiết để vận hành dịch vụ.
          </li>
          <li>
            <strong>Yêu cầu pháp lý</strong> — khi có lệnh từ cơ quan pháp luật có thẩm quyền,
            chúng tôi có nghĩa vụ cung cấp theo quy định pháp luật.
          </li>
          <li>
            <strong>Bảo vệ quyền lợi</strong> — để ngăn chặn gian lận, lạm dụng hoặc bảo vệ an
            toàn của người dùng và cộng đồng.
          </li>
        </ul>
        <Bilingual>
          We do <strong>not sell</strong> your personal data to third parties. Data is shared only
          with infrastructure service providers (e.g., Cloudflare, database providers) on a
          need-to-operate basis; under legal requirements from competent authorities; or to prevent
          fraud, abuse, or protect the safety of users and the community.
        </Bilingual>
      </Section>

      {/* ─── 6 ─── */}
      <Section id="cookies">
        <SectionHeading en="Cookies & Tracking Technologies">
          6. Cookie & Công nghệ theo dõi
        </SectionHeading>
        <p>Chúng tôi sử dụng cookie vì các mục đích sau:</p>
        <DataTable
          rows={[
            ["Session Cookie", "Duy trì trạng thái đăng nhập của bạn", "Bắt buộc"],
            ["Tùy chọn giao diện", "Ghi nhớ chủ đề, ngôn ngữ", "Chức năng"],
            ["Phân tích ẩn danh", "Hiểu cách dịch vụ được sử dụng (không nhận dạng cá nhân)", "Tùy chọn"],
          ]}
          headers={["Loại Cookie", "Mục đích", "Danh mục"]}
        />
        <p>
          Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng của dịch vụ
          có thể bị ảnh hưởng.
        </p>
        <Bilingual>
          We use cookies for: session cookies (required, to maintain login state); UI preferences
          (functional, to remember theme and language); and anonymous analytics (optional, to
          understand how the service is used without identifying individuals). You may disable
          cookies in your browser settings; however, some service features may be affected.
        </Bilingual>
      </Section>

      {/* ─── 7 ─── */}
      <Section id="rights">
        <SectionHeading en="Your Rights">7. Quyền của Bạn</SectionHeading>
        <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>
        <ul>
          <li>
            <strong>Quyền truy cập:</strong> Yêu cầu bản sao dữ liệu chúng tôi lưu giữ về bạn.
          </li>
          <li>
            <strong>Quyền chỉnh sửa:</strong> Cập nhật thông tin không chính xác qua trang cài đặt
            tài khoản.
          </li>
          <li>
            <strong>Quyền xóa:</strong> Yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan.
          </li>
          <li>
            <strong>Quyền phản đối:</strong> Từ chối một số hoạt động xử lý dữ liệu không bắt buộc.
          </li>
          <li>
            <strong>Quyền di chuyển dữ liệu:</strong> Nhận dữ liệu của bạn ở định dạng có thể đọc
            được bằng máy tính.
          </li>
        </ul>
        <p>
          Để thực hiện bất kỳ quyền nào ở trên, vui lòng liên hệ chúng tôi qua địa chỉ email tại
          Mục 11.
        </p>
        <Bilingual>
          You have the right to: access (request a copy of your data); rectify (update inaccurate
          information via account settings); erasure (request deletion of your account and all
          associated data); object (opt out of certain non-mandatory processing activities); and
          data portability (receive your data in a machine-readable format). To exercise any of
          these rights, please contact us via the address in Section 11.
        </Bilingual>
      </Section>

      {/* ─── 8 ─── */}
      <Section id="retention">
        <SectionHeading en="Data Retention">8. Thời gian Lưu trữ</SectionHeading>
        <p>
          Chúng tôi lưu trữ dữ liệu tài khoản trong suốt thời gian tài khoản còn hoạt động. Sau
          khi tài khoản bị xóa:
        </p>
        <ul>
          <li>Thông tin hồ sơ và dữ liệu nhận dạng được xóa trong vòng <strong>30 ngày</strong>.</li>
          <li>Nội dung tin nhắn được ẩn danh hóa hoặc xóa tùy theo cài đặt của máy chủ liên quan.</li>
          <li>Nhật ký hệ thống (system logs) có thể được giữ lại tối đa <strong>90 ngày</strong> cho mục đích bảo mật.</li>
        </ul>
        <Bilingual>
          We retain account data for the duration the account remains active. After account
          deletion: profile information and identifying data are deleted within 30 days; message
          content is anonymized or deleted depending on the relevant server's settings; system logs
          may be retained for up to 90 days for security purposes.
        </Bilingual>
      </Section>

      {/* ─── 9 ─── */}
      <Section id="minors">
        <SectionHeading en="Children">9. Trẻ em</SectionHeading>
        <p>
          Bravechat không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập dữ liệu
          cá nhân từ trẻ em dưới độ tuổi này. Nếu bạn phát hiện một tài khoản thuộc về trẻ dưới 13
          tuổi, vui lòng báo cáo ngay cho chúng tôi để có biện pháp xử lý kịp thời.
        </p>
        <Bilingual>
          Bravechat is not intended for children under the age of 13. We do not knowingly collect
          personal data from children under this age. If you discover an account belonging to a
          child under 13, please report it to us immediately for prompt action.
        </Bilingual>
      </Section>

      {/* ─── 10 ─── */}
      <Section id="changes">
        <SectionHeading en="Policy Changes">10. Thay đổi Chính sách</SectionHeading>
        <p>
          Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian. Mọi thay đổi quan trọng
          sẽ được thông báo thông qua email hoặc thông báo nổi bật trên nền tảng trước ít nhất{" "}
          <strong>7 ngày</strong> khi có hiệu lực. Việc tiếp tục sử dụng dịch vụ sau thời điểm đó
          đồng nghĩa với việc bạn chấp nhận phiên bản cập nhật.
        </p>
        <Bilingual>
          We may update this Privacy Policy from time to time. Significant changes will be notified
          via email or prominent notice on the platform at least <strong>7 days</strong> before
          taking effect. Continued use of the service after that point constitutes your acceptance of
          the updated version.
        </Bilingual>
      </Section>

      {/* ─── 11 ─── */}
      <Section id="contact">
        <SectionHeading en="Contact">11. Liên hệ</SectionHeading>
        <p>
          Để biết thêm thông tin hoặc thực hiện yêu cầu liên quan đến dữ liệu cá nhân, vui lòng
          liên hệ:
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
          For more information or to submit a data-related request, please contact
          us via GitHub at github.com/Bravee9/Bravechat.
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

function DataTable({
  rows,
  headers,
}: {
  rows: string[][];
  headers?: string[];
}) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border border-ocean-dark-border text-sm">
        {headers && (
          <thead>
            <tr className="bg-ocean-dark-surface">
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2 text-ocean-secondary text-xs font-bold uppercase tracking-wider border-b border-ocean-dark-border"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-ocean-dark-border hover:bg-ocean-dark-surface/50 transition-colors"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 text-ocean-light/80 ${j === 0 ? "font-bold text-ocean-secondary" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
