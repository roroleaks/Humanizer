import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AppLayoutShell } from '@/components/layout';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Scientific Humanizer | Academic Writing Intelligence Platform',
  description: 'Scientific Clarity. Natural Expression. Research Integrity. Specialized academic manuscript refinement platform.',
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
