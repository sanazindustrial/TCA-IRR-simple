import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { CopyProtection } from '@/components/copy-protection';
import { BetaBanner } from '@/components/BetaBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TCA-IRR APP',
  description: 'AI-powered startup evaluation platform.',
  other: {
    'x-ui-build': 'fix-418-v2',
  },
  icons: {
    icon: '/icon.jpg',
    shortcut: '/icon.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hydrationRecoveryScript = `
    (function () {
      var KEY = '__tca_hydration_recover_once__';
      var PARAM = '__r';
      function alreadyRecovered() {
        try { return sessionStorage.getItem(KEY) === '1'; } catch (_) { return false; }
      }
      function markRecovered() {
        try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
      }
      function recover() {
        if (alreadyRecovered()) return;
        markRecovered();
        try {
          var url = new URL(window.location.href);
          url.searchParams.set(PARAM, Date.now().toString());
          window.location.replace(url.toString());
        } catch (_) {
          window.location.reload();
        }
      }
      function isHydration418(message) {
        return typeof message === 'string' &&
          message.indexOf('Minified React error #418') !== -1;
      }
      window.addEventListener('error', function (event) {
        var message = event && event.error && event.error.message
          ? event.error.message
          : (event && event.message ? event.message : '');
        if (isHydration418(message)) recover();
      }, true);
      window.addEventListener('unhandledrejection', function (event) {
        var reason = event && event.reason;
        var message = reason && reason.message ? reason.message : '';
        if (isHydration418(message)) recover();
      }, true);
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="hydration-recovery"
          strategy="beforeInteractive"
        >
          {hydrationRecoveryScript}
        </Script>
      </head>
      <body
        className={`${inter.variable} font-body antialiased`}
      >
        <BetaBanner />
        <CopyProtection />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
