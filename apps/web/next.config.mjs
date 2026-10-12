/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // packages/shared is source-only TypeScript (no build step)
  transpilePackages: ["@discord-clone/shared"],
};

export default nextConfig;
