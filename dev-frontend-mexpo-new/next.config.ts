import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://s3.smktelkom-mlg.sch.id https://img.youtube.com https://i.ytimg.com https://via.placeholder.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://app.sandbox.midtrans.com https://app.midtrans.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' http://localhost:* https://localhost:* https://mexpo-api.smktelkom-mlg.sch.id https://*.smktelkom-mlg.sch.id https://app.sandbox.midtrans.com https://app.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com https://accounts.google.com https://*.googleapis.com",
      "frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://accounts.google.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
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
    remotePatterns: [
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
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
