/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  output: 'export',
  // When statically exporting, set basePath and assetPrefix if deploying to a subfolder
  // If deploying to root, these can remain undefined
  assetPrefix: isProd ? undefined : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
