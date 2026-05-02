import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    resolveAlias: {
      // pdfjs-dist references `canvas` only in its Node.js code path; stub it for browser builds
      canvas: "./src/canvas-stub.js",
    },
  },
};

export default nextConfig;
