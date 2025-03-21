import { ChannelIO } from '@/third-parties/Channelio';
import Clarity from '@/third-parties/Clarity';
import { GoogleAnalytics } from '@next/third-parties/google'
import { GA_MEASUREMENT_ID } from './gtag';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Script from 'next/script';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/header';
import Link from 'next/link';
import { AuthProvider } from '@/components/auth/auth-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI 탐구생활',
  description: 'AI로 더 나은 삶을 만들어가는 공간',
  themeColor: '#4f46e5',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="ko">
      <ChannelIO />
      <head>
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
          integrity="sha384-6MFdIr0zOira1CHQkedUqJVql0YtcZA1P0nbPrQYJQSySY9VM5c9SQJpsgRFfvmx"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      
  {/* Google Analytics */}
  <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      <Clarity />
  </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
