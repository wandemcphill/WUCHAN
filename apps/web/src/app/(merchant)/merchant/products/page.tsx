'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { ProductBOMView } from '@/features/merchant/views/ProductBOMView';

export default function ProductsPage() {
  const { adapter } = useMerchant();
  return <ProductBOMView adapter={adapter} />;
}
