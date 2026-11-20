/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

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
