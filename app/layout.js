import './globals.css';
import { AuthProvider, AuthGate } from '../components/Auth';

export const metadata = {
  title: 'RollUp — competitive lawn bowls',
  description: 'Train. Compete. Diagnose. Adjust.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAF9F6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-NZ">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="shell">
          <AuthProvider>
            <AuthGate>{children}</AuthGate>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
