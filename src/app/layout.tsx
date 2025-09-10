import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/components/shared/ToastProvider';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Peekberry - Visual Website Editor',
  description: 'Edit any website with natural language commands',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ErrorBoundary>
            <QueryProvider>
              <ThemeProvider>
                <ToastProvider>{children}</ToastProvider>
              </ThemeProvider>
            </QueryProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
