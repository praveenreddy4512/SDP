/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['play-lh.googleusercontent.com'],
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
}

module.exports = nextConfig 