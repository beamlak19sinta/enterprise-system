'use client';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout({ children }) {
  const { theme } = useAuthStore();
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ERP System</title>
        <meta name="description" content="Enterprise Resource Planning System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontSize: '14px' } }} />
      </body>
    </html>
  );
}
