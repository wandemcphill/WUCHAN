import React from 'react';

export const metadata = {
  title: 'WUCHAN B2B Prefab Platform Foundation',
  description: 'International B2B Prefab & Modular Building Operations'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', margin: 0, padding: 0, background: '#f8fafc', color: '#0f172a' }}>
        <header style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>WUCHAN Platform Foundation</h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</a>
            <a href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none' }}>Dashboard Shell</a>
          </nav>
        </header>
        <main style={{ padding: '2rem' }}>{children}</main>
      </body>
    </html>
  );
}
