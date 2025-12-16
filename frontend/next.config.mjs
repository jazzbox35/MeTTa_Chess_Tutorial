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
        //destination: "http://127.0.0.1:5000/:path*",
        destination: "https://mettawamjam.onrender.com/:path*",
      },
    ]
  },
}

export default nextConfig
