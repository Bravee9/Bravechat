/**
 * components/landing/FooterSection.tsx
 * Site footer — Ocean Swiss Minimalist
 */

import Link from "next/link";

const FOOTER_LINKS = {
  "Sản phẩm": [
    { label: "Tính năng", href: "#features" },
    { label: "Lộ trình", href: "/roadmap" },
    { label: "Changelog", href: "/changelog" },
    { label: "Trạng thái hệ thống", href: "/status" },
  ],
  "Phát triển": [
    { label: "API Reference", href: "/docs/api-reference" },
    { label: "Kiến trúc", href: "/docs/architecture" },
    { label: "Database Schema", href: "/docs/database-schema" },
    { label: "GitHub", href: "https://github.com/Bravee9/Bravechat" },
  ],
  "Pháp lý": [
    { label: "Điều khoản sử dụng", href: "/terms" },
    { label: "Chính sách bảo mật", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export function FooterSection() {
  return (
    <footer className="bg-[#030C10] border-t border-ocean-dark-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-ocean-dark-border">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/favicon.png" alt="Bravechat Icon" className="w-8 h-8 object-contain" />
              <span className="font-bold text-xl text-ocean-light tracking-tight">
                Brave<span className="text-ocean-secondary">chat</span>
              </span>
            </div>
            <p className="text-ocean-light/70 text-sm leading-relaxed max-w-xs">
              Nền tảng giao tiếp thời gian thực dành cho cộng đồng, tổ chức và doanh nghiệp.
              Phát triển bởi{" "}
              <a
                href="https://github.com/Bravee9"
                target="_blank"
                rel="noreferrer"
                className="text-ocean-secondary hover:text-ocean-light"
              >
                Bravee9
              </a>{" "}
              ·{" "}
              <a
                href="https://github.com/Shuji7245"
                target="_blank"
                rel="noreferrer"
                className="text-ocean-secondary hover:text-ocean-light"
              >
                Shuji7245
              </a>
            </p>

            {/* Tech stack badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {["Next.js", "Fastify", "PostgreSQL", "Redis", "R2"].map(
                (tech) => (
                  <span
                    key={tech}
                    className="text-[10px] font-bold uppercase tracking-wider text-ocean-light/60 border border-ocean-dark-border px-2 py-1"
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-ocean-light text-xs font-bold uppercase tracking-widest mb-5">
                {category}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ocean-light/70 text-sm hover:text-ocean-secondary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ocean-light/70 text-xs font-mono">
            © {new Date().getFullYear()} Bravechat. Phát triển tại Việt Nam.
          </p>
          <div className="flex items-center gap-6">
            {/* GitHub */}
            <a
              id="footer-github"
              href="https://github.com/Bravee9/Bravechat"
              target="_blank"
              rel="noreferrer"
              className="text-ocean-light/70 hover:text-ocean-secondary transition-colors"
              aria-label="GitHub Repository"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 animate-pulse" />
              <span className="text-ocean-light/70 text-xs font-mono">
                Hệ thống hoạt động bình thường
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
