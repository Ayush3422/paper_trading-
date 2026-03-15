import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/Toaster';

export const metadata: Metadata = {
  title:       'PaperTrade — Neural Grid Trading',
  description: 'Master the markets with zero risk. Algo-powered paper trading with real-time data.',
  keywords:    ['paper trading', 'algo trading', 'stock market', 'investment simulator'],
  themeColor:  '#04050d',
  viewport:    'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#04050d] text-[#f0f2ff] antialiased bg-mesh bg-noise">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}