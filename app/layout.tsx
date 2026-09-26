import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nova AI Chat',
  description: 'Chat AI seperti ChatGPT, dibangun dengan Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-base-900 text-gray-100">{children}</body>
    </html>
  );
}
