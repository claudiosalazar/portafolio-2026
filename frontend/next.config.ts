import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },
  images: {
    remotePatterns: [
      {
        // Producción
        protocol: "https",
        hostname: "api.claudiosalazar.cl",
        port: "",
        pathname: "/**",
      },
      {
        // Desarrollo local
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
