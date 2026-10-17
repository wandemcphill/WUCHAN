import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { WorkspaceProvider } from '@/lib/context';
import { formatMinorUnits } from '@/lib/currency';
import { CatalogProduct, fetchCatalog } from '@/lib/server/catalog';

export const dynamic = 'force-dynamic';

export default async function BuildIndexPage() {
  const result = await fetchCatalog<CatalogProduct[]>('/catalog/products');
  const products = result.data || [];

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
          <div>
            <h1 className="text-3xl font-extrabold">Build your prefab</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Choose a factory model, set color, size, length, and specification, then place the order. A choice outside the published list is sent back as a special quote.
            </p>
          </div>

          {result.error && (
            <p className="rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-100">{result.error}</p>
          )}
          {!result.error && products.length === 0 && (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
              No public models are published yet.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {products.map((product) => (
              <Link
                key={product.id}
                href={'/build/' + product.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-blue-500"
              >
                <p className="font-mono text-xs text-blue-300">{product.sku}</p>
                <h2 className="mt-1 text-xl font-bold">{product.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{product.description}</p>
                <p className="mt-4 text-sm text-emerald-300">
                  From {formatMinorUnits({ amountCents: Number(product.base_price_cents), currency: product.currency })}
                  {' · '}
                  {product.lead_time_days} days
                </p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </WorkspaceProvider>
  );
}
