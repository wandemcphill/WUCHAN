import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { WorkspaceProvider } from '@/lib/context';
import { PrefabBuilder } from '@/features/customer/PrefabBuilder';
import { CatalogProduct, fetchCatalog } from '@/lib/server/catalog';

export const dynamic = 'force-dynamic';

export default async function BuildProductPage({ params }: { params: { productId: string } }) {
  const result = await fetchCatalog<CatalogProduct>('/catalog/products/' + encodeURIComponent(params.productId));

  if (result.error || !result.data) {
    return (
      <WorkspaceProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Header />
          <main className="mx-auto max-w-3xl px-4 py-10">
            <p className="rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-100">
              {result.error || 'This model is not available.'}
            </p>
            <Link href="/build" className="mt-4 inline-block text-sm text-blue-300">Back to buildable models</Link>
          </main>
        </div>
      </WorkspaceProvider>
    );
  }

  return <PrefabBuilder product={result.data} />;
}
