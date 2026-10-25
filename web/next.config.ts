import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads live data from MySQL/MongoDB, so Cache Components is off and
  // pages render per request (`dynamic = "force-dynamic"` in each page).
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
