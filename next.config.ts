import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Object form (no `search`) so URLs with query strings are allowed too.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google profile pictures
      { protocol: "https", hostname: "res.cloudinary.com" }, // task images
    ],
  },
};

export default nextConfig;
