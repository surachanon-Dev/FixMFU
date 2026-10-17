/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
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
