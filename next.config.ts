import type { NextConfig } from "next";

const securityHeaders = [
  // Anti-clickjacking (frame-ancestors cubre navegadores modernos; X-Frame-Options los viejos).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Evita MIME sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtrar rutas/tokens en el Referer hacia terceros.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Fuerza HTTPS en el navegador (2 años).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Solo el propio sitio puede usar cámara/geolocalización (para las fotos); micrófono deshabilitado.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow up to 5 photos per inspection (camera photos can be several MB each).
      bodySizeLimit: "40mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      // URL limpia para el prototipo interactivo público (sin login).
      { source: "/prototipo", destination: "/prototipo.html" },
      // URL limpia para el deck gerencial "Tercios Pollo Vivo 2026" (estático en public/tercios).
      { source: "/tercios", destination: "/tercios/index.html" },
    ];
  },
};

export default nextConfig;
