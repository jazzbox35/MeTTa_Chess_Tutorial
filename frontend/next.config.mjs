/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://69.169.108.141:5001/:path*",
        //destination: "https://mwj-latest.onrender.com/:path*",
      },
    ]
  },
}

export default nextConfig
