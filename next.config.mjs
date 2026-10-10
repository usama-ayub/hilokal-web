/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["ioredis", "mongoose", "bcryptjs", "livekit-server-sdk"],
};

export default nextConfig;
