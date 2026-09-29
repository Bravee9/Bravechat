/**
 * app/cookies/page.tsx
 * Cookie Policy / Chính sách Cookie
 */

import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Cookie Policy of Bravechat — how we use cookies and similar tracking technologies.",
};

const SECTIONS = [
  { id: "what", label: "1. Cookie là gì?" },
  { id: "types", label: "2. Các loại Cookie" },
  { id: "usage", label: "3. Chúng tôi dùng Cookie như thế nào" },
  { id: "control", label: "4. Kiểm soát Cookie" },
  { id: "contact", label: "5. Liên hệ" },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Chính sách Cookie"
      titleEn="Cookie Policy"
      lastUpdated="28/09/2026"
      sections={SECTIONS}
    >
      <Section id="what">
        <SectionHeading en="What Are Cookies?">1. Cookie là gì?</SectionHeading>
        <p>
          Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập một
          trang web. Chúng giúp trang web ghi nhớ thông tin về lượt truy cập của bạn — ví dụ như
          trạng thái đăng nhập hoặc tùy chọn ngôn ngữ — giúp trải nghiệm tiếp theo trở nên thuận
          tiện hơn.
        </p>
        <Bilingual>
          Cookies are small text files stored on your device when you visit a website. They help
          websites remember information about your visit — such as your login state or language
          preference — making your next visit more convenient.
        </Bilingual>
      </Section>

      <Section id="types">
        <SectionHeading en="Types of Cookies We Use">2. Các loại Cookie</SectionHeading>
        <DataTable
          headers={["Loại / Type", "Mô tả / Description", "Thời hạn / Duration"]}
          rows={[
            [
              "Bắt buộc (Strictly Necessary)",
              "Cần thiết để dịch vụ hoạt động. Duy trì phiên đăng nhập và token xác thực. / Required for the service to function. Maintains login sessions and authentication tokens.",
              "Phiên làm việc / Session",
            ],
            [
              "Chức năng (Functional)",
              "Ghi nhớ tùy chọn giao diện (chủ đề tối/sáng) và ngôn ngữ. / Remembers UI preferences (dark/light theme) and language.",
              "1 năm / 1 year",
            ],
            [
              "Phân tích (Analytics)",
              "Thu thập dữ liệu ẩn danh về cách người dùng tương tác với dịch vụ. Không nhận dạng cá nhân. / Collects anonymized data on how users interact with the service. Non-identifying.",
              "6 tháng / 6 months",
            ],
          ]}
        />
      </Section>

      <Section id="usage">
        <SectionHeading en="How We Use Cookies">
          3. Chúng tôi dùng Cookie như thế nào
        </SectionHeading>
        <ul>
          <li>Duy trì trạng thái đăng nhập và bảo mật phiên làm việc.</li>
          <li>Ghi nhớ tùy chọn cá nhân hóa giao diện của bạn.</li>
          <li>Phân tích hành vi sử dụng ẩn danh để cải thiện dịch vụ.</li>
          <li>Ngăn chặn gian lận và đảm bảo tính toàn vẹn của hệ thống xác thực.</li>
        </ul>
        <p>
          Bravechat <strong>không</strong> sử dụng cookie để hiển thị quảng cáo có mục tiêu.
        </p>
        <Bilingual>
          We use cookies to: maintain login state and session security; remember your UI
          personalization preferences; analyze anonymized usage behavior to improve the service; and
          prevent fraud and ensure authentication integrity. Bravechat does <strong>not</strong> use
          cookies for targeted advertising.
        </Bilingual>
      </Section>

      <Section id="control">
        <SectionHeading en="Managing Cookies">4. Kiểm soát Cookie</SectionHeading>
        <p>
          Bạn có thể kiểm soát và xóa cookie thông qua cài đặt trình duyệt của mình. Tuy nhiên,
          việc tắt cookie bắt buộc có thể khiến bạn không thể đăng nhập hoặc sử dụng đầy đủ tính
          năng của Bravechat.
        </p>
        <p>Hướng dẫn quản lý cookie cho từng trình duyệt phổ biến:</p>
        <ul>
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noreferrer"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
              target="_blank"
              rel="noreferrer"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
              target="_blank"
              rel="noreferrer"
            >
              Apple Safari
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406"
              target="_blank"
              rel="noreferrer"
            >
              Microsoft Edge
            </a>
          </li>
        </ul>
        <Bilingual>
          You can control and delete cookies through your browser settings. However, disabling
          strictly necessary cookies may prevent you from logging in or using certain Bravechat
          features. Browser-specific instructions are linked above.
        </Bilingual>
      </Section>

      <Section id="contact">
        <SectionHeading en="Contact">5. Liên hệ</SectionHeading>
        <p>Mọi câu hỏi về Chính sách Cookie, vui lòng liên hệ qua GitHub repository của chúng tôi.</p>
        <Bilingual>
          For any questions about this Cookie Policy, please contact us via GitHub.
        </Bilingual>
      </Section>
    </LegalLayout>
  );
}

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

function DataTable({ rows, headers }: { rows: string[][]; headers?: string[] }) {
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
