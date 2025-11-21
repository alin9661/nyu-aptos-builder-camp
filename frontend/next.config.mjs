/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false, // Enable Vercel image optimization
    domains: [], // Add external image domains if needed
  },
  // Removed 'output: standalone' - incompatible with Vercel serverless
  // Vercel uses its own serverless output format
}

export default nextConfig