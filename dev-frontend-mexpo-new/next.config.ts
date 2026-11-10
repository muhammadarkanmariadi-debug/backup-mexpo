import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const rawEnvUrls = [
  process.env.NEXT_PUBLIC_BASE_URL_PRODUCTION,
  process.env.NEXT_PUBLIC_BASE_URL_DEVELOPMENT,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_STORAGE_URL,
].filter((url): url is string => Boolean(url && url.trim()));

const dynamicOrigins = Array.from(
  new Set(
    rawEnvUrls.flatMap((raw) => {
      try {
        const parsed = new URL(raw);
        return [parsed.origin];
      } catch {
        return [];
      }
    }),
  ),
);

const dynamicRemotePatterns: RemotePattern[] = rawEnvUrls.flatMap((raw) => {
  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol.replace(":", "") as "http" | "https";
    return [
      {
        protocol,
        hostname: parsed.hostname,
        ...(parsed.port ? { port: parsed.port } : {}),
      },
    ];
  } catch {
    return [];
  }
});

const devLocalhostOrigins =
  process.env.NODE_ENV !== "production"
    ? ["http://localhost:*", "https://localhost:*"]
    : [];

const cspOrigins = [...dynamicOrigins, ...devLocalhostOrigins].join(" ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com https://accounts.google.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: ${cspOrigins} https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com https://s3.*.amazonaws.com https://s3.amazonaws.com https://images.unsplash.com https://img.youtube.com https://i.ytimg.com https://via.placeholder.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://app.sandbox.midtrans.com https://app.midtrans.com`,
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${cspOrigins} https://app.sandbox.midtrans.com https://app.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com https://accounts.google.com https://*.googleapis.com https://cloudflareinsights.com https://*.cloudflareinsights.com`,
      // Google Maps embeds (event location + contact page) render from www/maps.google.com.
      "frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://accounts.google.com https://www.google.com https://maps.google.com",
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
    // Uploads (event photo, logos, speaker photos, CMS images, …) go through
    // server actions, whose default 1 MB body limit rejected most real photos
    // with a 413. The backend accepts images up to 4 MB, plus multipart overhead.
    serverActions: {
      bodySizeLimit: "5mb",
    },
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
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Local dev serves uploads from MinIO on localhost:9000; Next 16 refuses to
    // optimize images from local IPs unless allowed. Never enabled in production.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      ...dynamicRemotePatterns,
      ...(process.env.NODE_ENV !== "production"
        ? [
            { protocol: "http" as const, hostname: "localhost" },
            { protocol: "https" as const, hostname: "localhost" },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
