import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AppLayoutShell } from '@/components/layout';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Humanizero — Scientific Clarity, Natural Expression & Research Integrity',
  description: 'Specialized academic manuscript refinement platform with deterministic integrity protection, Vancouver ICMJE preservation, and multi-provider AI orchestration.',
  icons: {
    icon: [
      { url: '/icon.png', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/icon.png'],
  },
  openGraph: {
    title: 'Humanizero — Academic Writing Intelligence Platform',
    description: 'Scientific Clarity. Natural Expression. Research Integrity.',
    url: 'https://humanizero.vercel.app',
    siteName: 'Humanizero',
    images: [{ url: '/humanizero-banner.jpg', width: 1200, height: 630, alt: 'Humanizero' }],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-slate-900 font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-teal-accent text-white font-semibold rounded-lg shadow-lg"
        >
          Skip to main content
        </a>
        <AppLayoutShell>{children}</AppLayoutShell>
      </body>
    </html>
  );
}
