import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de comprobantes de pago tomadas con celular pueden pesar
      // más que el límite por defecto (1mb).
      bodySizeLimit: "5mb",
    },
    // Sin esto, el Router Cache del cliente puede seguir mostrando una
    // página protegida (ej. /reservar) ya renderizada ANTES de cerrar
    // sesión, al navegar ahí de nuevo con un <Link> — el pedido nunca
    // vuelve a tocar el servidor (ni el middleware de autenticación) hasta
    // que la caché expira. Con toda la app dependiendo de sesión por rol
    // (cliente/barbero/admin), cada navegación dinámica debe revalidar
    // siempre contra el servidor.
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      // Fotos de cortes subidas por el admin vía Vercel Blob (acceso público).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
