/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output requires symlinks, which require elevated privileges on Windows.
  // We enable it in Docker or non-Windows CI/CD environments.
  output: process.env.DOCKER_BUILD === "true" || process.platform !== "win32" ? "standalone" : undefined,
  // packages/shared is source-only TypeScript (no build step)
  transpilePackages: ["@discord-clone/shared"],
};

export default nextConfig;
