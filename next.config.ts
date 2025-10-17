import type { NextConfig } from "next";

const isStatic = process.env.BUILD_MODE === "static";

const nextConfig: NextConfig = {
  ...(isStatic && {
    output: "export",
    trailingSlash: true,
    basePath: "/combine-pdf-files",
    assetPrefix: "/combine-pdf-files",
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
