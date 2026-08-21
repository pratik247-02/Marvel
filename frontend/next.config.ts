import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // TMDB - posters and profile images supplied by the ETL pipeline.
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      // Marvel CDN - used by some curated character art.
      { protocol: "https", hostname: "*.marvel.com" },
      // MCU Fandom wiki - character infobox portraits.
      { protocol: "https", hostname: "static.wikia.nocookie.net" },
      // Wikimedia - fallback for public-domain stills.
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
