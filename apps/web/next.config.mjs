/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@paper-trading/types'],
  images: { domains: ['avatars.githubusercontent.com', 'ui-avatars.com'] },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_WS_URL:  process.env.NEXT_PUBLIC_WS_URL  || 'http://localhost:4000',
  },
};
export default nextConfig;
