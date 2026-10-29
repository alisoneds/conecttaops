import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Permite que o Next.js lide melhor com o ambiente Docker
  output: "standalone",
};

export default nextConfig;
