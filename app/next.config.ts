import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  transpilePackages: ["remediate"],
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

// Turbopack requires loader options to be serializable, so plugin references
// are passed by package name (string) rather than as imported function refs.
const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
  },
});

export default withMDX(nextConfig);
