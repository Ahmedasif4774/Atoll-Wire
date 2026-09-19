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
};

export default nextConfig;
