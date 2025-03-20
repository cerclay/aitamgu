/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_YAHOO_FINANCE_API_KEY: process.env.YAHOO_FINANCE_API_KEY,
    NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY
  },
  images: {
    domains: ['picsum.photos']
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

module.exports = nextConfig;