import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lastfm.freetls.fastly.net', 'i.scdn.co', 'images.unsplash.com'],
  }
};

export default nextConfig;
