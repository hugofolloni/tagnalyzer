import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lastfm.freetls.fastly.net', 'i.scdn.co'],
  }
};

export default nextConfig;
