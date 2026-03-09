/** @type {import('next').NextConfig} */

// Bundle analyzer para desarrollo
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

// next-intl para internacionalización
const withNextIntl = require('next-intl/plugin')('./i18n.ts');


const nextConfig = {
  // SSR mode for production (no output: 'export')
  // This enables 'npm run start' with Node.js server
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  trailingSlash: false,

  // Optimizaciones de React 18
  reactStrictMode: true,

  experimental: {
    optimizeCss: false, // Deshabilitado para evitar error de critters en build
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      'zustand',
      'recharts',
      'date-fns',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // NOTA: Los headers de seguridad están en netlify.toml
  // ya que con output: 'export' no se pueden usar aquí

  httpAgentOptions: {
    keepAlive: true,
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
            priority: 50,
            enforce: true,
          },
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
