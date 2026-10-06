import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WUCHAN | International Prefab & Modular Commerce Platform',
  description: 'Serious B2B procurement workspace for commercial prefab, modular cabins, and steel-frame buildings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
