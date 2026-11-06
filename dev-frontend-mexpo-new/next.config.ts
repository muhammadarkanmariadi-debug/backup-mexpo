import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.4rk4n.dev http://*.4rk4n.dev https://100.27.43.122:* http://100.27.43.122:* https://98.80.142.172:* http://98.80.142.172:* https://localhost:* http://localhost:* https://images.unsplash.com https://s3.smktelkom-mlg.sch.id https://img.youtube.com https://i.ytimg.com https://via.placeholder.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://app.sandbox.midtrans.com https://app.midtrans.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.4rk4n.dev http://*.4rk4n.dev https://100.27.43.122:* http://100.27.43.122:* https://98.80.142.172:* http://98.80.142.172:* https://localhost:* http://localhost:* https://mexpo-api.smktelkom-mlg.sch.id https://*.smktelkom-mlg.sch.id https://app.sandbox.midtrans.com https://app.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com https://accounts.google.com https://*.googleapis.com",
      "frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://accounts.google.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@fortawesome/react-fontawesome",
      "@fortawesome/free-solid-svg-icons",
      "recharts",
      "framer-motion",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.4rk4n.dev',
      },
      {
        protocol: 'http',
        hostname: '*.4rk4n.dev',
      },
      {
        protocol: 'https',
        hostname: 'dev-backend-expo.4rk4n.dev',
      },
      {
        protocol: 'http',
        hostname: 'dev-backend-expo.4rk4n.dev',
      },
      {
        protocol: 'https',
        hostname: 'dev-frontend-expo.4rk4n.dev',
      },
      {
        protocol: 'http',
        hostname: 'dev-frontend-expo.4rk4n.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 's3.smktelkom-mlg.sch.id',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '100.27.43.122',
      },
      {
        protocol: 'https',
        hostname: '100.27.43.122',
      },
      {
        protocol: 'http',
        hostname: '98.80.142.172',
      },
      {
        protocol: 'https',
        hostname: '98.80.142.172',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
