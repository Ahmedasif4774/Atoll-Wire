/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sanity Studio's code assumes it only ever runs in the browser, but
  // Next.js's App Router will otherwise try to include it in the React
  // Server Components bundle too — and in that bundle, React resolves to a
  // stripped-down build that's missing things like createContext, causing
  // "createContext is not a function" when opening /studio. Marking these
  // packages "external" tells Next.js to load them the normal Node.js way
  // at runtime instead of bundling them into that server graph.
  experimental: {
    serverComponentsExternalPackages: ["sanity", "@sanity/vision"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },

  // Baseline security headers — this app had none set before, which left
  // every page open to being framed by another site (clickjacking) and
  // browsers guessing content types instead of trusting the served one.
  // frame-ancestors intentionally allows 'self' only (nothing here needs to
  // be embedded elsewhere); it does NOT affect this site embedding OTHER
  // sites' content (the YouTube/Facebook live-banner iframes, Sanity Studio
  // link) since that's controlled by the iframed site's own headers, not
  // ours.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
