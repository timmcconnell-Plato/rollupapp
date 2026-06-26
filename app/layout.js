import './globals.css';
import { AuthProvider, AuthGate } from '../components/Auth';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'RollUp — competitive lawn bowls',
  description: 'Train. Compete. Diagnose. Adjust.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAFAF9',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-NZ">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="shell">
          <AuthProvider>
            <AuthGate>{children}</AuthGate>
          </AuthProvider>
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
