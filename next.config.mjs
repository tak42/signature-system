/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL
  }
};

export default nextConfig;