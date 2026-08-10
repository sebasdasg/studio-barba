import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de comprobantes de pago tomadas con celular pueden pesar
      // más que el límite por defecto (1mb).
      bodySizeLimit: "5mb",
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
