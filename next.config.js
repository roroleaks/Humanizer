/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SH_APP_NAME: process.env.SH_APP_NAME || 'Scientific Humanizer',
    NEXT_PUBLIC_SH_APP_ENV: process.env.SH_APP_ENV || 'development',
    NEXT_PUBLIC_SH_MAX_PAGES: process.env.SH_MAX_PAGES || '15',
    NEXT_PUBLIC_SH_PAGE_WORD_DENSITY: process.env.SH_PAGE_WORD_DENSITY || '500',
    NEXT_PUBLIC_SH_AI_PRIMARY_PROVIDER: process.env.SH_AI_PRIMARY_PROVIDER || 'openai',
    NEXT_PUBLIC_SH_AI_FALLBACK_PROVIDERS: process.env.SH_AI_FALLBACK_PROVIDERS || 'gemini,anthropic',
  },
};

module.exports = nextConfig;
