import type { NextConfig } from "next";

const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Allow next/image to load:
    //   - the user's Supabase Storage signed URLs (avatars + renders)
    //   - Grailed CDN product images shown in the marketplace panel
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
      { protocol: "https", hostname: "cdn.grailed.com", pathname: "/**" },
      { protocol: "https", hostname: "process.grailed.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
