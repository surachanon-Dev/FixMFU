/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "microphone=(), payment=(), usb=()" },
        // Leave scripts, styles and connections to Next.js/Motion/Supabase unchanged.
        { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
      ],
    }];
  },
  async redirects() {
    return [
      { source: "/", destination: "/user", permanent: false },
      { source: "/report", destination: "/user/report", permanent: false },
      { source: "/ticket/:id", destination: "/user/ticket/:id", permanent: false },
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
      { source: "/dashboard", destination: "/admin/dashboard", permanent: false },
      { source: "/kanban", destination: "/admin/tickets", permanent: false },
      { source: "/admin/kanban", destination: "/admin/tickets", permanent: false },
      { source: "/settings", destination: "/admin/settings", permanent: false },
    ];
  },
};

export default nextConfig;
