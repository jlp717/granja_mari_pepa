/** @type {import('next').NextConfig} */

// Bundle analyzer para desarrollo
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true }) // eslint-disable-line @typescript-eslint/no-require-imports -- Next14 CommonJS plugin entrypoint retained from Main.
    : (config) => config;

// next-intl para internacionalización
const withNextIntl = require("next-intl/plugin")("./i18n.ts"); // eslint-disable-line @typescript-eslint/no-require-imports -- Next14 CommonJS config entrypoint retained from Main.

const nextConfig = {
  // Separate dev and production artifacts without changing the default Main path.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // SSR mode for production (no output: 'export')
  // This enables 'npm run start' with Node.js server
  // NOTE: eslint/typescript checks enforced — no ignore flags
  images: {
    unoptimized: false,
    qualities: [62, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/3296279/pexels-photo-3296279.jpeg",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/1639557/pexels-photo-1639557.jpeg",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/1640774/pexels-photo-1640774.jpeg",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/291528/pexels-photo-291528.jpeg",
      },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  trailingSlash: false,

  // Optimizaciones de React 18
  reactStrictMode: true,

  experimental: {
    inlineCss: true,
    cssChunking: "strict",
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "zustand",
      "recharts",
      "date-fns",
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Node serves the real app. This bounded policy preserves existing script,
  // image and API integrations while constraining objects, base and workers.
  async headers() {
    return [
      {
        source: "/gmp/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/catalogs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/pdf/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/og-maripepa.jpg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value:
              "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; worker-src 'self' blob:;",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },

  httpAgentOptions: {
    keepAlive: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5000/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:5000/uploads/:path*",
      },
    ];
  },

  webpack: (config, { dev }) => {
    // Dev-only: avoid persistent webpack cache exhausting the local disk.
    if (dev) config.cache = false;

    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
