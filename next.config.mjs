/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
