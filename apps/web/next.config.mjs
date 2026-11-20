/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none';",
  },
];

const nextConfig = {
  // Standalone output requires symlinks, which require elevated privileges on Windows.
  // We enable it in Docker or non-Windows self-hosted builds (Vercel manages its own output).
  output:
    process.env.DOCKER_BUILD === "true" ||
    (process.platform !== "win32" && process.env.VERCEL !== "1")
      ? "standalone"
      : undefined,
  // packages/shared is source-only TypeScript (no build step)
  transpilePackages: ["@discord-clone/shared"],
  // Disable Next.js development indicator badge and toolbar (the floating "N" icon)
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  ...(apiProxyTarget
    ? {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${apiProxyTarget}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
