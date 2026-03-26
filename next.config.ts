import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the root to avoid Next.js inferring a parent folder with a lockfile.
    root: __dirname,
  },
}

export default withNextIntl(nextConfig)
