import React from 'react';
import '../index.css';

export const metadata = {
  title: 'WUCHAN — Merchant & Factory Operational Workspace',
  description: 'B2B prefab/modular-building commerce and factory operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">{children}</body>
    </html>
  );
}
