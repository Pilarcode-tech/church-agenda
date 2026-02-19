import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário para o Payload funcionar na Vercel
  experimental: {
    reactCompiler: false,
  },
  // Permite imagens de domínios externos se necessário
  images: {
    remotePatterns: [],
  },
}

export default withPayload(nextConfig)
